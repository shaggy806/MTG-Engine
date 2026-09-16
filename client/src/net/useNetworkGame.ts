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
import type { Action, LegalAction, ObjectId, PlayerId, PlayerView } from 'engine'
import type { Frame } from '../game/usePlayback.ts'
import type { ClientMessage, SeatStatus, ServerMessage, WireDeck } from './protocol.ts'

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
  /** Whether *my* seat currently has an auto-pass in effect. */
  readonly autoPassing: boolean
  /** Whether *my* seat is currently skipping mana-only priority windows. */
  readonly skipManaOnly: boolean
  /** Changes whenever a new state arrives — a stable signature for `key`ing UI. */
  readonly revision: number
  /** Tells the server this client has finished showing frame `seq`. The room
   * won't let a bot take its next move until every seat that acks has caught
   * up, which is what keeps bot play in step with the animations. */
  ackFrame: (seq: number) => void
  createRoom: (seed?: number, players?: number) => void
  joinRoom: (roomId: string) => void
  /** Claims `seat` (the first time it's called for that seat) or updates it
   * (any later call — reuses the same seat's already-stored token, so the
   * server treats it as a reclaim rather than a conflicting claim). That's
   * also how the seat-picker changes its own deck while un-ready: call this
   * again with a new `deck` and no `ready`. `ready`, when given, sets this
   * seat's ready state as part of the same call — the "Ready" button's
   * first click claims and readies in one round trip. */
  claimSeat: (seat: PlayerId, displayName?: string, deck?: WireDeck, ready?: boolean) => void
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
  const pendingClaimRef = useRef<{ seat: PlayerId; clientToken: string } | null>(null)
  const unmountedRef = useRef(false)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimeoutRef = useRef<number | null>(null)
  /** Always holds the latest `openSocket`, so a scheduled retry can call it
   * without `openSocket` naming itself inside its own initializer. */
  const openSocketRef = useRef<() => void>(() => {})

  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [everConnected, setEverConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [seats, setSeats] = useState<readonly SeatStatus[]>([])
  const [seat, setSeat] = useState<PlayerId | null>(null)
  const [frame, setFrame] = useState<Frame | null>(null)
  const [autoPassing, setAutoPassing] = useState(false)
  const [skipManaOnly, setSkipManaOnly] = useState(false)
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
      send({ type: 'join-room', roomId: id })
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
          roomIdRef.current = message.roomId
          setRoomId(message.roomId)
          window.history.replaceState(null, '', roomUrl(message.roomId))
          joinRoomId(message.roomId)
          return
        }
        case 'room-joined': {
          joiningRef.current = false
          roomIdRef.current = message.roomId
          setRoomId(message.roomId)
          setSeats(message.seats)
          const pending = pendingClaimRef.current
          if (pending) {
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
          if (stored) {
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
          if (pending && message.seat === pending.seat) {
            storeSeat(message.roomId, pending.seat, pending.clientToken)
            pendingClaimRef.current = null
          }
          if (!wasPlaying) setError(null)
          setSeats(message.seats)
          setSeat(message.seat)
          setFrame({ seq: message.seq, view: message.view, actions: message.actions })
          setAutoPassing(message.autoPassing)
          setSkipManaOnly(message.skipManaOnly)
          setStatus('playing')
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
          if (!isPlayingRef.current) {
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

  const createRoom = useCallback(
    (seed?: number, players?: number) => send({ type: 'create-room', seed, players }),
    [send],
  )

  const joinRoom = useCallback(
    (id: string) => {
      joiningRef.current = true
      roomIdRef.current = id
      window.history.replaceState(null, '', roomUrl(id))
      send({ type: 'join-room', roomId: id })
    },
    [send],
  )

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

  const dispatch = useCallback(
    (action: Action) => {
      const id = roomIdRef.current
      if (id === null) return
      send({ type: 'dispatch', roomId: id, action })
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

  const nameOf = useCallback(
    (id: ObjectId): string => {
      const o = view?.objects[id]
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
    roomId,
    seats,
    seat,
    opponents,
    frame,
    view,
    actions,
    autoPassing,
    skipManaOnly,
    revision: frame?.seq ?? 0,
    ackFrame,
    createRoom,
    joinRoom,
    claimSeat,
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
    nameOf,
    clearError,
    reconnect,
  }
}
