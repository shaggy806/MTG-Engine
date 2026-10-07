/**
 * The rematch, as the client sees it: telling a rematch's first frame from
 * the old game's next one, and what the end-of-game panel offers each player.
 * Pure, so it can be tested without a socket or a page.
 */

import type { PlayerId } from 'engine/client'
import type { SeatStatus } from 'protocol'

/** Which game of which room a frame is from (the `state` message's `game`). */
export interface GameKey {
  readonly roomId: string
  readonly game: number
}

/**
 * Whether `next` is a rematch of the game `prev` was from: the same room, a
 * later game. Not a first frame (`prev` null), and not another room's game
 * (a new room starts counting at 1 again, which says nothing about this one).
 */
export function isRematch(prev: GameKey | null, next: GameKey): boolean {
  return prev !== null && prev.roomId === next.roomId && next.game > prev.game
}

/** What the end-of-game panel offers beside Main menu. */
export type RematchOffer =
  /** The host's button: "Blitz again" in a blitz's room, where that's what
   * the landing page called it, else "Rematch". */
  | { readonly kind: 'button'; readonly label: string }
  /** Everyone else waits on the host, named when they hold a seat. */
  | { readonly kind: 'waiting'; readonly host: PlayerId | null }

/** `null` in a room the server can't rematch (a scenario builder's, or one a
 * script built). */
export function rematchOffer(room: {
  readonly canRematch: boolean
  readonly isHost: boolean
  readonly blitz: boolean
  readonly seats: readonly SeatStatus[]
}): RematchOffer | null {
  if (!room.canRematch) return null
  if (room.isHost) return { kind: 'button', label: room.blitz ? 'Blitz again' : 'Rematch' }
  return { kind: 'waiting', host: room.seats.find((s) => s.isHost)?.player ?? null }
}
