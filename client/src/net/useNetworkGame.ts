/**
 * Owns the WebSocket connection to the room server and exposes the current
 * seat's view of the game. Unlike the old hot-seat `useGame`, this device
 * never holds a `Game` — it only ever sees the one seat's redacted `PlayerView`
 * the server pushes it, and every action is sent over the wire rather than
 * dispatched locally.
 *
 * On load: a `?room=CODE` in the URL joins that room; otherwise the caller
 * gets `status: 'no-room'` and can create or join one. Once a room is joined,
 * a previously-claimed seat (its token stored in sessionStorage, keyed by
 * room id) is reclaimed automatically; otherwise `status: 'choosing-seat'`
 * lists the open seats to pick from.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Action, LegalAction, ObjectId, PlayerId, PlayerView } from 'engine/client'
import type { Frame } from '../game/usePlayback.ts'
import { realId } from '../game/stackMembers.ts'
import type { BotSpeed, CaptureSummary, ClientMessage, PassSettings, SeatStatus, ServerMessage, WireDeck } from 'protocol'

const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ??
  `ws://${window.location.hostname}:4000`

export type ConnectionStatus =
  | 'connecting'
  | 'no-room'
  | 'room-not-found'
  | 'choosing-seat'
  /** My own seat is claimed, but the room's `Game` doesn't exist yet — at
   * least one other seat is still open (see the server's `PendingRoom`).
   * `seat` is set the same as it is once `playing`; `seats` keeps updating
   * live as other seats fill. */
  | 'waiting-for-players'
  | 'playing'
  | 'disconnected'

const MAX_RECONNECT_DELAY_MS = 8000

/** A stable empty list, so "no frame yet" doesn't look like a changed
 * `actions` prop on every re-render. */
const EMPTY_ACTIONS: readonly LegalAction[] = []

interface StoredSeat {
  readonly seat: PlayerId
  readonly clientToken: string
}

const storageKey = (roomId: string): string => `mtg-engine:room:${roomId}`

// sessionStorage, not localStorage: it's scoped per-tab even on the same
// origin, so two seats claimed from two tabs of the same browser (two
// people on one device, or just testing) don't stomp on each other's stored
// token the way a shared per-room localStorage key would. The cost is that
// closing a tab (not just reloading it) forgets the seat — reopening the
// room just means picking it again, since the server frees a seat as soon
// as its connection closes.
function loadStoredSeat(roomId: string): StoredSeat | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(roomId))
    return raw ? (JSON.parse(raw) as StoredSeat) : null
  } catch {
    return null
  }
}

function storeSeat(roomId: string, seat: PlayerId, clientToken: string): void {
  try {
    window.sessionStorage.setItem(storageKey(roomId), JSON.stringify({ seat, clientToken }))
  } catch {
    // A private window or blocked storage just skips persistence — the seat
    // picker still works, it just won't auto-reclaim on the next load.
  }
}

/** The host token for a room this tab created (see the server's `HostRole`).
 * Per-tab for the same reason the seat token is: two tabs are two players. */
const hostKey = (roomId: string): string => `mtg-engine:host:${roomId}`

function loadHostToken(roomId: string): string | undefined {
  try {
    return window.sessionStorage.getItem(hostKey(roomId)) ?? undefined
  } catch {
    return undefined
  }
}

function storeHostToken(roomId: string, token: string): void {
  try {
    window.sessionStorage.setItem(hostKey(roomId), token)
  } catch {
    // Blocked storage: this tab is still host until it reconnects.
  }
}

function clearStoredSeat(roomId: string): void {
  try {
    window.sessionStorage.removeItem(storageKey(roomId))
  } catch {
    // ignore — see storeSeat
  }
}

function newClientToken(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

function roomUrl(roomId: string): URL {
  const url = new URL(window.location.href)
  url.searchParams.set('room', roomId)
  return url
}

function clearRoomFromUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('room')
  window.history.replaceState(null, '', url)
}

/** What a capture-enabled server has answered so far — see
 * `NetworkGame.capture`. */
export interface CaptureState {
  /** The room's recent bot decisions, newest first, once listed. */
  readonly entries: readonly CaptureSummary[] | null
  /** What the bot could have done at one of them, once asked. */
  readonly options: {
    readonly id: number
    readonly did: string
    readonly options: readonly { readonly index: number; readonly text: string }[]
  } | null
  /** Where the last save was written. */
  readonly saved: string | null
}

const NO_CAPTURE: CaptureState = { entries: null, options: null, saved: null }

export interface NetworkGame {
  readonly status: ConnectionStatus
  /** Whether this page has ever had the room server on the line. A first
   * visit to a server that isn't up yet fails the same way a mid-game drop
   * does — `onerror` then `onclose`, straight to `disconnected` without ever
   * passing through `no-room` — but "lost the connection" is untrue for
   * someone who has only just arrived, and it reads as though they broke
   * something. The retry loop is identical either way; only the wording
   * differs (see `App`'s `disconnected` branch). */
  readonly everConnected: boolean
  readonly error: string | null
  /** Bumped by every error that arrives, including a repeat of the one
   * already showing. `error` alone can't tell a second identical refusal
   * from the first (setting the same string doesn't even re-render), so the
   * toast keys on this to restart its clock and its fade. */
  readonly errorSeq: number
  readonly roomId: string | null
  readonly seats: readonly SeatStatus[]
  readonly seat: PlayerId | null
  readonly opponents: readonly PlayerId[]
  /**
   * The most recent push, whole: its frame number, the board, and what this
   * seat may do on it. Handed to `usePlayback`, which plays each frame's
   * animations out before showing its board — so anything the *player* looks
   * at should come from there, not from `view` below.
   */
  readonly frame: Frame | null
  /** The newest board the server has sent, which during an animation is
   * ahead of what's drawn. For bookkeeping that has to be current (seating,
   * card names) rather than for rendering the table. */
  readonly view: PlayerView | null
  readonly actions: readonly LegalAction[]
  /** Whether *my* seat currently has an auto-pass in effect, paused or not. */
  readonly autoPassing: boolean
  /** Whether that auto-pass is paused while something I'd want to respond
   * to plays out. It resumes by itself once the stack is clear. */
  readonly autoPassPaused: boolean
  /** Whether *my* seat is currently skipping mana-only priority windows. */
  readonly skipManaOnly: boolean
  /** Whether this client runs the room: sizes the table, fills bot seats,
   * starts the game, sets bot speed. The room's creator, or a stand-in while
   * they're away. */
  readonly isHost: boolean
  readonly botSpeed: BotSpeed
  /** Host only — the server refuses anyone else. */
  setBotSpeed: (speed: BotSpeed) => void
  /** The host has paused the bots; every seat sees it. */
  readonly botsPaused: boolean
  /** Host only: pause or resume the bots, or let one held move go. */
  setBotsPaused: (paused: boolean) => void
  stepBots: () => void
  /** Changes whenever a new state arrives — a stable signature for `key`ing UI. */
  readonly revision: number
  /** Tells the server this client has finished showing frame `seq`. The room
   * won't let a bot take its next move until every seat that acks has caught
   * up, which is what keeps bot play in step with the animations. */
  ackFrame: (seq: number) => void
  /** Opens a two-seat room with this tab as its host. The table is sized
   * from the seat board afterwards (`addSeat`/`removeSeat`). */
  createRoom: () => void
  joinRoom: (roomId: string) => void
  /** Walks back out of a room that hasn't started yet, to the landing page —
   * giving up my seat, if I hold one, so the table can fill it again. */
  leaveRoom: () => void
  /** Claims `seat` (the first time it's called for that seat) or updates it
   * (any later call — reuses the same seat's already-stored token, so the
   * server treats it as a reclaim rather than a conflicting claim). That's
   * also how the seat-picker changes its own deck while un-ready: call this
   * again with a new `deck` and no `ready`. `ready`, when given, sets this
   * seat's ready state as part of the same call — the "Ready" button's
   * first click claims and readies in one round trip. */
  claimSeat: (seat: PlayerId, displayName?: string, deck?: WireDeck, ready?: boolean) => void
  /** Takes whichever seat the waiting room has free (adding one to a full
   * table under four), un-readied — what arriving in a waiting room does. */
  takeSeat: (displayName?: string, deck?: WireDeck) => void
  /** Whether the joined room is still the waiting room. */
  readonly roomPending: boolean
  /** Concede the game (rule 104.3a): lose and leave it, and keep watching. */
  concede: () => void
  /** Hand my seat to a bot (`true`) or take it back (`false`). */
  setBotTakeover: (on: boolean) => void
  /** Send my priority-passing preferences to the server, which does the
   * passing (`game/passSettings.ts`). */
  sendPassSettings: (settings: PassSettings) => void
  /** Fills an open seat with a basic heuristic bot instead of a human.
   * Omitted `deck` falls back to that seat's positional starter deck. */
  addBot: (seat: PlayerId, deck?: WireDeck) => void
  /** Adds one more seat to the table, up to four — how the table is sized,
   * now that the landing page doesn't ask. Only usable before the game
   * starts. */
  addSeat: () => void
  /** Drops an open or bot-filled seat, down to two. A seat a human has
   * claimed is refused by the server. */
  removeSeat: (seat: PlayerId) => void
  /** Changes which deck an already-bot-filled seat brings — only usable
   * before the room's game has started. */
  setBotDeck: (seat: PlayerId, deck: WireDeck) => void
  /** Toggles my own already-claimed seat between ready and not — only usable
   * before the room's game has started. Un-ready to edit my deck again. */
  setReady: (ready: boolean) => void
  /** Explicitly starts the game — only takes effect once every seat is
   * filled and ready; the server rejects it otherwise. */
  startGame: () => void
  dispatch: (action: Action) => void
  passTurn: () => void
  /** Toggles auto-passing my priority windows clean through an opponent's
   * turn too, stopping only once it's my own turn again. */
  autoPass: () => void
  /** Toggles a standing preference: skip my own priority windows where the
   * only legal thing to do is tap for mana. Off by default (manually passing
   * with mana up is how you bluff having an instant). */
  toggleManaSkip: () => void
  /** One-shot: pass my priority until the stack has drained. Stops as soon
   * as anything real happens — a decision for me, an opponent acting, or
   * something of mine being targeted or leaving the battlefield. */
  resolveAll: () => void
  /** Whether the server keeps bot decisions for saving as training
   * scenarios — a developer's server (`--capture`), never the public site. */
  readonly captureEnabled: boolean
  readonly capture: CaptureState
  /** Asks for the room's recent bot decisions (host only). */
  captureList: () => void
  /** Asks what the bot could have done at decision `id`. */
  captureOptions: (id: number) => void
  /** Saves decision `id` as a training scenario: option `expect` was the
   * right answer, or anything but what the bot did. */
  captureSave: (id: number, expect: number | 'not-this', note: string, name?: string) => void
  /** Files a bug report: the game as it stands, with what went wrong. */
  captureReport: (title: string, description: string, image?: string) => void
  /** Forgets the capture answers, for closing the panel. */
  clearCapture: () => void
  nameOf: (id: ObjectId) => string
  clearError: () => void
  reconnect: () => void
}

export function useNetworkGame(): NetworkGame {
  const wsRef = useRef<WebSocket | null>(null)
  const roomIdRef = useRef<string | null>(null)
  const isPlayingRef = useRef(false)
  /** True while waiting on the reply to a `join-room` we just sent — an
   * `error` in that window means the room itself is gone, not just a
   * rejected seat claim or dispatch. */
  const joiningRef = useRef(false)
  /** A seat claim sent but not yet confirmed by a `state` message. The seat is
   * only written to `sessionStorage` once confirmed, so a rejected claim never
   * poisons the auto-reclaim on the next load. */
  const pendingClaimRef = useRef<{ seat: PlayerId | null; clientToken: string } | null>(null)
  /** The host token sent with `create-room`, kept until `room-created` says
   * which room it belongs to. */
  const pendingHostTokenRef = useRef<string | null>(null)
  const unmountedRef = useRef(false)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimeoutRef = useRef<number | null>(null)
  /** Always holds the latest `openSocket`, so a scheduled retry can call it
   * without `openSocket` naming itself inside its own initializer. */
  const openSocketRef = useRef<() => void>(() => {})

  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [everConnected, setEverConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorSeq, setErrorSeq] = useState(0)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [seats, setSeats] = useState<readonly SeatStatus[]>([])
  const [seat, setSeat] = useState<PlayerId | null>(null)
  /** Whether the joined room is still the waiting room (no `Game` yet). */
  const [roomPending, setRoomPending] = useState(false)
  const [frame, setFrame] = useState<Frame | null>(null)
  const [autoPassing, setAutoPassing] = useState(false)
  const [autoPassPaused, setAutoPassPaused] = useState(false)
  const [skipManaOnly, setSkipManaOnly] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [botSpeed, setBotSpeedState] = useState<BotSpeed>('normal')
  const [botsPaused, setBotsPausedState] = useState(false)
  const [captureEnabled, setCaptureEnabled] = useState(false)
  const [capture, setCapture] = useState<CaptureState>(NO_CAPTURE)
  const view = frame?.view ?? null
  const actions = frame?.actions ?? EMPTY_ACTIONS

  const send = useCallback((message: ClientMessage) => {
    wsRef.current?.send(JSON.stringify(message))
  }, [])

  const openSocket = useCallback(() => {
    const ws = new WebSocket(SERVER_URL)
    wsRef.current = ws
    isPlayingRef.current = false
    const isCurrent = () => wsRef.current === ws

    const joinRoomId = (id: string) => {
      joiningRef.current = true
      roomIdRef.current = id
      send({ type: 'join-room', roomId: id, hostToken: loadHostToken(id) })
    }

    ws.onopen = () => {
      if (!isCurrent()) return
      reconnectAttemptRef.current = 0
      setEverConnected(true)
      setError(null)
      const fromUrl = new URL(window.location.href).searchParams.get('room')
      if (fromUrl) {
        joinRoomId(fromUrl)
      } else {
        setStatus('no-room')
      }
    }

    ws.onmessage = (event) => {
      if (!isCurrent()) return
      const message = JSON.parse(event.data as string) as ServerMessage
      switch (message.type) {
        case 'room-created': {
          if (pendingHostTokenRef.current !== null) {
            storeHostToken(message.roomId, pendingHostTokenRef.current)
            pendingHostTokenRef.current = null
          }
          roomIdRef.current = message.roomId
          setRoomId(message.roomId)
          window.history.replaceState(null, '', roomUrl(message.roomId))
          joinRoomId(message.roomId)
          return
        }
        case 'room-joined': {
          // A seat-board refresh the server sent before it saw my
          // `leave-room` — I've already left, so it mustn't pull me back in.
          if (message.roomId !== roomIdRef.current) return
          joiningRef.current = false
          roomIdRef.current = message.roomId
          setRoomId(message.roomId)
          setSeats(message.seats)
          setIsHost(message.isHost)
          setBotSpeedState(message.botSpeed)
          setRoomPending(message.pending === true)
          const pending = pendingClaimRef.current
          if (pending && pending.seat === null) {
            // A `take-seat` in flight: the server names the seat it gave us.
            // A board refresh from before it was handled has none yet.
            const given = message.seat ?? null
            if (given === null) return
            pendingClaimRef.current = { seat: given, clientToken: pending.clientToken }
            storeSeat(message.roomId, given, pending.clientToken)
            setSeat(given)
            setStatus('waiting-for-players')
            return
          }
          if (pending && pending.seat !== null) {
            // My own claim-seat (just now, or the auto-reclaim below on an
            // earlier room-joined) evidently succeeded — an outright
            // rejection would have come back as `error` instead, not this.
            // The room just isn't ready to start yet (see the server's
            // `PendingRoom`) — persist the claim now rather than waiting for
            // a `state` that might be a while off, so a refresh while
            // waiting still reclaims the same seat; stay on this status
            // showing a waiting panel until a real `state` promotes us.
            storeSeat(message.roomId, pending.seat, pending.clientToken)
            setSeat(pending.seat)
            setStatus('waiting-for-players')
            return
          }
          const stored = loadStoredSeat(message.roomId)
          // In a waiting room the seat board takes a seat itself (`takeSeat`,
          // which reuses the stored token, so a readied seat comes back and
          // an un-readied one, freed when this device dropped, is taken
          // again with the deck it had).
          if (stored && message.pending !== true) {
            pendingClaimRef.current = {
              seat: stored.seat,
              clientToken: stored.clientToken,
            }
            send({
              type: 'claim-seat',
              roomId: message.roomId,
              seat: stored.seat,
              clientToken: stored.clientToken,
            })
          } else {
            setStatus('choosing-seat')
          }
          return
        }
        case 'state': {
          const wasPlaying = isPlayingRef.current
          isPlayingRef.current = true
          // A `state` for our pending seat confirms the claim — persist it now,
          // and clear any "seat is taken" error from an earlier failed attempt.
          const pending = pendingClaimRef.current
          if (pending && pending.seat !== null && message.seat === pending.seat) {
            storeSeat(message.roomId, pending.seat, pending.clientToken)
            pendingClaimRef.current = null
          }
          if (!wasPlaying) setError(null)
          setSeats(message.seats)
          setSeat(message.seat)
          setFrame({ seq: message.seq, view: message.view, actions: message.actions })
          setAutoPassing(message.autoPassing)
          setAutoPassPaused(message.autoPassPaused)
          setSkipManaOnly(message.skipManaOnly)
          setIsHost(message.isHost)
          setBotSpeedState(message.botSpeed)
          setBotsPausedState(message.botsPaused === true)
          setCaptureEnabled(message.capture === true)
          setStatus('playing')
          return
        }
        case 'capture-list': {
          setCapture((c) => ({ ...c, entries: message.entries, saved: null }))
          return
        }
        case 'capture-options': {
          setCapture((c) => ({
            ...c,
            options: { id: message.id, did: message.did, options: message.options },
            saved: null,
          }))
          return
        }
        case 'capture-saved': {
          setCapture((c) => ({ ...c, saved: message.file }))
          return
        }
        case 'error': {
          if (joiningRef.current) {
            // The room itself doesn't exist (e.g. the server restarted) —
            // distinct from a rejected seat claim or in-game dispatch.
            joiningRef.current = false
            roomIdRef.current = null
            setRoomId(null)
            clearRoomFromUrl()
            setStatus('room-not-found')
            return
          }
          setError(message.message)
          setErrorSeq((n) => n + 1)
          if (!isPlayingRef.current && roomIdRef.current !== null) {
            // A rejected seat claim — drop the unconfirmed claim and any stored
            // token for it, so nothing (an auto-reclaim included) retries it in
            // a loop. The server follows up with a fresh `room-joined`.
            if (pendingClaimRef.current !== null) {
              const id = roomIdRef.current
              if (id !== null) clearStoredSeat(id)
              pendingClaimRef.current = null
            }
            setStatus('choosing-seat')
          }
          return
        }
      }
    }

    ws.onclose = () => {
      if (!isCurrent() || unmountedRef.current) return
      isPlayingRef.current = false
      setStatus('disconnected')
      const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, MAX_RECONNECT_DELAY_MS)
      reconnectAttemptRef.current += 1
      reconnectTimeoutRef.current = window.setTimeout(() => openSocketRef.current(), delay)
    }
    ws.onerror = () => {
      if (!isCurrent()) return
      setError('Could not reach the room server.')
      setErrorSeq((n) => n + 1)
    }
  }, [send])

  useEffect(() => {
    openSocketRef.current = openSocket
  }, [openSocket])

  useEffect(() => {
    unmountedRef.current = false
    openSocket()
    return () => {
      unmountedRef.current = true
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      wsRef.current?.close()
    }
  }, [openSocket])

  const createRoom = useCallback(() => {
    const hostToken = newClientToken()
    pendingHostTokenRef.current = hostToken
    send({ type: 'create-room', hostToken })
  }, [send])

  const joinRoom = useCallback(
    (id: string) => {
      joiningRef.current = true
      roomIdRef.current = id
      window.history.replaceState(null, '', roomUrl(id))
      send({ type: 'join-room', roomId: id, hostToken: loadHostToken(id) })
    },
    [send],
  )

  const setBotSpeed = useCallback(
    (speed: BotSpeed) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'set-bot-speed', roomId: id, speed })
    },
    [send],
  )

  const setBotsPaused = useCallback(
    (paused: boolean) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'set-bots-paused', roomId: id, paused })
    },
    [send],
  )

  const stepBots = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'step-bots', roomId: id })
  }, [send])

  const claimSeat = useCallback(
    (chosen: PlayerId, displayName?: string, deck?: WireDeck, ready?: boolean) => {
      const id = roomIdRef.current
      if (id === null) return
      // Reuse the seat's already-stored token when this is an update to a
      // seat we've already claimed (e.g. changing our own deck while
      // un-ready) — a fresh token here would read to the server as a
      // different device trying to steal an already-claimed seat.
      const existing = loadStoredSeat(id)
      const token = existing && existing.seat === chosen ? existing.clientToken : newClientToken()
      // Not persisted yet — the `room-joined`/`state` handlers store it once
      // the server confirms the claim (see `pendingClaimRef`).
      pendingClaimRef.current = { seat: chosen, clientToken: token }
      send({ type: 'claim-seat', roomId: id, seat: chosen, clientToken: token, displayName, deck, ready })
    },
    [send],
  )

  const takeSeat = useCallback(
    (displayName?: string, deck?: WireDeck) => {
      const id = roomIdRef.current
      if (id === null) return
      // A token this device already holds a seat with here takes that seat
      // back rather than a second one.
      const token = loadStoredSeat(id)?.clientToken ?? newClientToken()
      pendingClaimRef.current = { seat: null, clientToken: token }
      send({ type: 'take-seat', roomId: id, clientToken: token, displayName, deck })
    },
    [send],
  )

  const concede = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'concede', roomId: id })
  }, [send])

  const sendPassSettings = useCallback(
    (settings: PassSettings) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'set-pass-settings', roomId: id, settings })
    },
    [send],
  )

  const setBotTakeover = useCallback(
    (on: boolean) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'bot-takeover', roomId: id, on })
    },
    [send],
  )

  const dispatch = useCallback(
    (action: Action) => {
      const id = roomIdRef.current
      if (id === null) return
      // A cast a resolving spell asked for ("you may cast that card" — the
      // `cast-now` decision) is built by the ordinary cast steps and sent as
      // that decision's answer.
      const sent: Action =
        action.type === 'cast-spell' && action.via === 'effect'
          ? { type: 'cast-now', player: action.player, cast: action }
          : action
      send({ type: 'dispatch', roomId: id, action: sent })
    },
    [send],
  )

  const ackFrame = useCallback(
    (seq: number) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'ack', roomId: id, seq })
    },
    [send],
  )

  const addBot = useCallback(
    (seat: PlayerId, deck?: WireDeck) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'add-bot', roomId: id, seat, deck })
    },
    [send],
  )

  const setBotDeck = useCallback(
    (seat: PlayerId, deck: WireDeck) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'set-bot-deck', roomId: id, seat, deck })
    },
    [send],
  )

  const leaveRoom = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'leave-room', roomId: id })
    // The server has just freed the seat, so the stored claim would only
    // reclaim someone else's the next time this room is joined.
    clearStoredSeat(id)
    pendingClaimRef.current = null
    joiningRef.current = false
    roomIdRef.current = null
    clearRoomFromUrl()
    setRoomId(null)
    setSeats([])
    setSeat(null)
    setRoomPending(false)
    setIsHost(false)
    setError(null)
    setStatus('no-room')
  }, [send])

  const addSeat = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'add-seat', roomId: id })
  }, [send])

  const removeSeat = useCallback(
    (seat: PlayerId) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'remove-seat', roomId: id, seat })
    },
    [send],
  )

  const setReady = useCallback(
    (ready: boolean) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'set-ready', roomId: id, ready })
    },
    [send],
  )

  const startGame = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'start-game', roomId: id })
  }, [send])

  const passTurn = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'pass-turn', roomId: id })
  }, [send])

  const autoPass = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'auto-pass', roomId: id })
  }, [send])

  const toggleManaSkip = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'toggle-mana-skip', roomId: id })
  }, [send])

  const resolveAll = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'resolve-all', roomId: id })
  }, [send])

  const captureList = useCallback(() => {
    const id = roomIdRef.current
    if (id === null) return
    send({ type: 'capture-list', roomId: id })
  }, [send])

  const captureOptions = useCallback(
    (capture: number) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'capture-options', roomId: id, id: capture })
    },
    [send],
  )

  const captureSave = useCallback(
    (capture: number, expect: number | 'not-this', note: string, name?: string) => {
      const id = roomIdRef.current
      if (id === null) return
      send({
        type: 'capture-save',
        roomId: id,
        id: capture,
        expect,
        note,
        ...(name !== undefined && name.trim() !== '' ? { name } : {}),
      })
    },
    [send],
  )

  const captureReport = useCallback(
    (title: string, description: string, image?: string) => {
      const id = roomIdRef.current
      if (id === null) return
      send({
        type: 'capture-report',
        roomId: id,
        title,
        description,
        ...(image !== undefined ? { image } : {}),
      })
    },
    [send],
  )

  const clearCapture = useCallback(() => setCapture(NO_CAPTURE), [])

  const nameOf = useCallback(
    (id: ObjectId): string => {
      // A member id (`<id>#<k>`, one token of a compacted stack while a
      // combat declaration is built — game/stackMembers.ts) is its stack.
      const o = view?.objects[realId(id)]
      return o ? (o.faceName ?? o.cardName) : id
    },
    [view],
  )

  const clearError = useCallback(() => setError(null), [])
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    reconnectAttemptRef.current = 0
    setStatus('connecting')
    setError(null)
    openSocket()
  }, [openSocket])

  // In turn order *starting right after this seat* (wrapping around), not
  // just "everyone else in the array" — so a seating layout (the quadrant
  // grid) can place the next player after you, then the next, etc. in a
  // consistent rotation regardless of where you sit in the raw turn order.
  const opponents = (() => {
    if (!view || seat === null) return []
    const i = view.turnOrder.indexOf(seat)
    return [...view.turnOrder.slice(i + 1), ...view.turnOrder.slice(0, i)]
  })()

  return {
    status,
    everConnected,
    error,
    errorSeq,
    roomId,
    seats,
    seat,
    opponents,
    frame,
    view,
    actions,
    autoPassing,
    autoPassPaused,
    skipManaOnly,
    isHost,
    botSpeed,
    setBotSpeed,
    botsPaused,
    setBotsPaused,
    stepBots,
    revision: frame?.seq ?? 0,
    ackFrame,
    createRoom,
    joinRoom,
    leaveRoom,
    claimSeat,
    takeSeat,
    roomPending,
    concede,
    setBotTakeover,
    sendPassSettings,
    addBot,
    setBotDeck,
    addSeat,
    removeSeat,
    setReady,
    startGame,
    dispatch,
    passTurn,
    autoPass,
    toggleManaSkip,
    resolveAll,
    captureEnabled,
    capture,
    captureList,
    captureOptions,
    captureSave,
    captureReport,
    clearCapture,
    nameOf,
    clearError,
    reconnect,
  }
}
