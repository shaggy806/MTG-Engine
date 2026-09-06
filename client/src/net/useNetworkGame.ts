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
import type { ClientMessage, SeatStatus, ServerMessage } from './protocol.ts'

const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ??
  `ws://${window.location.hostname}:4000`

export type ConnectionStatus =
  | 'connecting'
  | 'no-room'
  | 'room-not-found'
  | 'choosing-seat'
  | 'playing'
  | 'disconnected'

const MAX_RECONNECT_DELAY_MS = 8000

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
  readonly error: string | null
  readonly roomId: string | null
  readonly seats: readonly SeatStatus[]
  readonly seat: PlayerId | null
  readonly opponents: readonly PlayerId[]
  readonly view: PlayerView | null
  readonly actions: readonly LegalAction[]
  /** Whether *my* seat currently has an auto-pass in effect. */
  readonly autoPassing: boolean
  /** Whether *my* seat is currently skipping mana-only priority windows. */
  readonly skipManaOnly: boolean
  /** Changes whenever a new state arrives — a stable signature for `key`ing UI. */
  readonly revision: number
  createRoom: (seed?: number, players?: number) => void
  joinRoom: (roomId: string) => void
  claimSeat: (seat: PlayerId) => void
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
  const unmountedRef = useRef(false)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimeoutRef = useRef<number | null>(null)
  /** Always holds the latest `openSocket`, so a scheduled retry can call it
   * without `openSocket` naming itself inside its own initializer. */
  const openSocketRef = useRef<() => void>(() => {})

  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [seats, setSeats] = useState<readonly SeatStatus[]>([])
  const [seat, setSeat] = useState<PlayerId | null>(null)
  const [view, setView] = useState<PlayerView | null>(null)
  const [actions, setActions] = useState<readonly LegalAction[]>([])
  const [autoPassing, setAutoPassing] = useState(false)
  const [skipManaOnly, setSkipManaOnly] = useState(false)
  const [revision, setRevision] = useState(0)

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
          const stored = loadStoredSeat(message.roomId)
          if (stored) {
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
          isPlayingRef.current = true
          setSeats(message.seats)
          setSeat(message.seat)
          setView(message.view)
          setActions(message.actions)
          setAutoPassing(message.autoPassing)
          setSkipManaOnly(message.skipManaOnly)
          setStatus('playing')
          setRevision((n) => n + 1)
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
          if (!isPlayingRef.current) setStatus('choosing-seat')
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
    (chosen: PlayerId) => {
      const id = roomIdRef.current
      if (id === null) return
      const token = newClientToken()
      storeSeat(id, chosen, token)
      send({ type: 'claim-seat', roomId: id, seat: chosen, clientToken: token })
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
    (id: ObjectId): string => view?.objects[id]?.cardName ?? id,
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

  const opponents = view ? view.turnOrder.filter((p) => p !== seat) : []

  return {
    status,
    error,
    roomId,
    seats,
    seat,
    opponents,
    view,
    actions,
    autoPassing,
    skipManaOnly,
    revision,
    createRoom,
    joinRoom,
    claimSeat,
    dispatch,
    passTurn,
    autoPass,
    toggleManaSkip,
    nameOf,
    clearError,
    reconnect,
  }
}
