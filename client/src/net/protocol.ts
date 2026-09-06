/**
 * The wire protocol between this client and the room server. Mirrors
 * `server/src/protocol.ts` exactly — duplicated rather than imported since
 * `server` (Node + `ws`) and `client` (browser bundle) are independent
 * workspaces. Keep the two in sync by hand.
 */

import type { Action, LegalAction, PlayerId, PlayerView } from 'engine'

export interface SeatStatus {
  readonly player: PlayerId
  /** Someone has claimed this seat (has a `clientToken` on file), regardless
   * of whether their connection is currently up. */
  readonly claimed: boolean
  /** Whether the claiming connection is live right now. Only meaningful
   * when `claimed` — an unclaimed seat is never `online`. */
  readonly online: boolean
  /** The claimer's chosen name, or `null` to fall back to the seat's own
   * label ("Alice", "Bob", ...). */
  readonly displayName: string | null
}

export type ClientMessage =
  | { readonly type: 'create-room'; readonly seed?: number; readonly players?: number }
  | { readonly type: 'join-room'; readonly roomId: string }
  | {
      readonly type: 'claim-seat'
      readonly roomId: string
      readonly seat: PlayerId
      readonly clientToken: string
      /** Omit to keep whatever name (if any) this seat already had — e.g. a
       * silent reconnect shouldn't blank out a name chosen earlier. */
      readonly displayName?: string
    }
  | {
      readonly type: 'dispatch'
      readonly roomId: string
      readonly action: Action
    }
  | { readonly type: 'pass-turn'; readonly roomId: string }
  | { readonly type: 'auto-pass'; readonly roomId: string }
  | { readonly type: 'toggle-mana-skip'; readonly roomId: string }

/** Mirrors `server/src/import-deck.ts`'s `CardReportEntry` — the response
 * shape of the plain HTTP `POST /import-deck` endpoint (not part of the
 * room-based WebSocket protocol above, since it's a stateless, non-room
 * operation). Duplicated by hand like the rest of this file. */
export interface ImportedCardReport {
  readonly name: string
  readonly count: number
  /** Already has a matching `CardDefinition` in the engine's registry. */
  readonly implemented: boolean
  /** Whether any characteristics data (local or Scryfall) was found to show. */
  readonly found: boolean
  readonly manaCost: string | null
  readonly typeLine: string
  readonly oracleText: string
}

export type ServerMessage =
  | { readonly type: 'room-created'; readonly roomId: string }
  | {
      readonly type: 'room-joined'
      readonly roomId: string
      readonly seats: readonly SeatStatus[]
    }
  | {
      readonly type: 'state'
      readonly roomId: string
      readonly seat: PlayerId
      readonly view: PlayerView
      readonly actions: readonly LegalAction[]
      readonly seats: readonly SeatStatus[]
      readonly autoPassing: boolean
      readonly skipManaOnly: boolean
    }
  | { readonly type: 'error'; readonly message: string }
