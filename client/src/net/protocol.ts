/**
 * The wire protocol between this client and the room server. Mirrors
 * `server/src/protocol.ts` exactly — duplicated rather than imported since
 * `server` (Node + `ws`) and `client` (browser bundle) are independent
 * workspaces. Keep the two in sync by hand.
 */

import type { Action, LegalAction, PlayerId, PlayerView } from 'engine'

/** A deck as it travels over the wire — `claim-seat`, `add-bot`, and
 * `set-bot-deck` all carry one of these. `name` is a display label only (the
 * client's local deck name, or a starter deck's name); nothing server-side
 * keys off it. */
export interface WireDeck {
  readonly cards: readonly string[]
  readonly commander?: string
  readonly name?: string
  /** Which printing of each card this deck brings, keyed by card name — a
   * Scryfall card id, which is all the server accepts here (see
   * `server/src/pending-room.ts`'s `assertPrintingsAreSafe`). */
  readonly printings?: Readonly<Record<string, string>>
}

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
  /** This seat is played by a basic heuristic bot, not a human — never
   * `claimed`/`online`. */
  readonly isBot: boolean
  /** The deck this seat is bringing, so every device in the room can show it
   * on the seat-picker screen — `null` only while the seat is still open
   * (neither claimed nor bot-filled). Always `null` once the room is
   * promoted to a real game, since that screen is behind us by then. */
  readonly deck: {
    readonly name: string
    readonly commander: string | null
    /** Which printing this deck brings for its commander, if it isn't the
     * default — just the one card, since the seat board only draws that. */
    readonly commanderPrinting: string | null
  } | null
  /** This seat has signaled it's ready to start (`set-ready`) — a bot seat
   * is always ready. The room only starts once every seat is ready
   * (`start-game`), not the instant the last seat is filled. Always `true`
   * once the room is promoted to a real game. */
  readonly ready: boolean
  /** This seat's player currently holds the host role. `false` for every
   * seat while the host hasn't claimed one. */
  readonly isHost: boolean
}

/** How long a bot's move sits on screen before its next one — the host's
 * setting. `'normal'` by default. */
export type BotSpeed = 'fast' | 'normal' | 'slow'

export type ClientMessage =
  | {
      readonly type: 'create-room'
      readonly seed?: number
      readonly players?: number
      /** Kept by the creating tab and presented on `join-room` to be host. */
      readonly hostToken?: string
    }
  | { readonly type: 'join-room'; readonly roomId: string; readonly hostToken?: string }
  | {
      readonly type: 'claim-seat'
      readonly roomId: string
      readonly seat: PlayerId
      readonly clientToken: string
      /** Omit to keep whatever name (if any) this seat already had — e.g. a
       * silent reconnect shouldn't blank out a name chosen earlier. */
      readonly displayName?: string
      /** The deck to seed this seat with (built or picked in the deck
       * builder). Omitted falls back to this seat's positional starter deck
       * — only meaningful the first time a seat is claimed, since the
       * room's Game doesn't exist yet before that (see server's
       * `PendingRoom`). */
      readonly deck?: WireDeck
      /** Sets this seat's ready state as part of the same claim — lets the
       * "Ready" button claim-and-ready in one round trip the first time a
       * seat is filled. Omitted leaves `ready` at whatever it already was.
       * A reclaim that also changes `deck` is rejected while the seat is
       * currently ready; un-ready first (`set-ready`). */
      readonly ready?: boolean
    }
  | {
      /** Fills an open seat with a basic heuristic bot instead of a human —
       * anyone in the room can do this to any still-open seat. Omitted
       * `deck` falls back to that seat's positional starter deck, same as an
       * omitted `deck` on `claim-seat`. */
      readonly type: 'add-bot'
      readonly roomId: string
      readonly seat: PlayerId
      readonly deck?: WireDeck
    }
  | {
      /** Changes which deck an already-bot-filled seat is bringing — only
       * meaningful before the room's game exists; once it's started, decks
       * are baked in and can't change. */
      readonly type: 'set-bot-deck'
      readonly roomId: string
      readonly seat: PlayerId
      readonly deck: WireDeck
    }
  | {
      /** Adds one more seat to a room that hasn't started yet — the seat
       * board's "Add seat" tile. How big the table is used to be answered on
       * the landing page, before anyone had seen a seat; it's asked here
       * instead, where the seats are visible and a wrong guess costs one
       * click. Rejected once the table is full (four seats). */
      readonly type: 'add-seat'
      readonly roomId: string
    }
  | {
      /** Drops a seat from a room that hasn't started yet. Rejected below two
       * seats, and for a seat a human has claimed — that player leaving is
       * theirs to do. An open or bot-filled seat is fair game for anyone in
       * the room, same as `add-bot` filling one. */
      readonly type: 'remove-seat'
      readonly roomId: string
      readonly seat: PlayerId
    }
  | {
      /** Toggles the caller's own already-claimed seat between ready and
       * not — the "Ready"/"Un-ready" button once a deck's already locked in.
       * Only valid before the room's game exists. */
      readonly type: 'set-ready'
      readonly roomId: string
      readonly ready: boolean
    }
  | {
      /** Explicitly starts the game once every seat is filled (bot or
       * claimed) and every human seat has readied up. Host only. Rejected
       * while any seat still isn't ready. */
      readonly type: 'start-game'
      readonly roomId: string
    }
  | {
      /** Host only; before or during the game. */
      readonly type: 'set-bot-speed'
      readonly roomId: string
      readonly speed: BotSpeed
    }
  | {
      readonly type: 'dispatch'
      readonly roomId: string
      readonly action: Action
    }
  | { readonly type: 'pass-turn'; readonly roomId: string }
  | { readonly type: 'auto-pass'; readonly roomId: string }
  | { readonly type: 'toggle-mana-skip'; readonly roomId: string }
  | {
      /** "I've finished showing frame `seq`" — sent once this client has
       * played that push's animations out and put the resulting board on
       * screen. The room holds a bot's next move until every acking seat has
       * caught up, which is what stops a bot playing three cards while the
       * first is still flying across the table. A client that never sends
       * these is simply never waited on. */
      readonly type: 'ack'
      readonly roomId: string
      readonly seq: number
    }

/** Mirrors `server/src/import-deck.ts`'s `ReplacementOption`: one suggested
 * stand-in for a card the engine doesn't implement. */
export interface ReplacementOption {
  readonly name: string
  /** How well it covers what the original does, judged on shared Scryfall
   * Tagger oracle tags — `'low'` when there was nothing to go on. */
  readonly confidence: 'high' | 'medium' | 'low'
  /** Oracle tags both cards carry, most telling first. */
  readonly sharedTags: readonly string[]
}

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
  /** The stand-in the import uses — `replacements[0]`, or `null` when
   * `implemented` or nothing is a sensible match. */
  readonly suggestedReplacement: string | null
  /** Up to three stand-ins, best first, chosen for this deck: inside its
   * commander's colour identity, never a card it already has, and never
   * another card's first choice. */
  readonly replacements: readonly ReplacementOption[]
  /** The Scryfall card id of the printing the pasted line named, so an
   * imported deck keeps the art it was exported with. Only ever set for an
   * `implemented` card — a substituted one is a different card, whose art
   * this printing says nothing about. */
  readonly printingId: string | null
}

/** Mirrors `engine`'s `DeckValidationResult` (plus the guessed/explicit
 * commander) — the `format` field of the `/import-deck` response. */
export interface DeckFormatReport {
  readonly legal: boolean
  readonly violations: readonly string[]
  readonly identity: string
  readonly commander: string | null
}

/** `POST /import-deck` answers with newline-delimited JSON, not one JSON
 * object: `progress` lines as the server resolves the list (cards the engine
 * already implements land at once, then each batched Scryfall lookup of up
 * to 75 unimplemented ones), followed by exactly one terminal `result` or
 * `error` line. Mirrors what `server/src/index.ts` writes. */
export type ImportDeckLine =
  | {
      readonly type: 'progress'
      readonly done: number
      readonly total: number
      /** The last card accounted for; `null` when nothing specific. */
      readonly name: string | null
    }
  | {
      readonly type: 'result'
      readonly cards: readonly ImportedCardReport[]
      readonly format: DeckFormatReport
    }
  | { readonly type: 'error'; readonly error: string }

export type ServerMessage =
  | { readonly type: 'room-created'; readonly roomId: string }
  | {
      readonly type: 'room-joined'
      readonly roomId: string
      readonly seats: readonly SeatStatus[]
      /** Whether *this* client holds the host role — including a host who
       * hasn't taken a seat. */
      readonly isHost: boolean
      readonly botSpeed: BotSpeed
    }
  | {
      readonly type: 'state'
      readonly roomId: string
      /** This push's frame number, counting up for the life of the room.
       * Played out in order and acked back once shown — see the `ack`
       * message above. */
      readonly seq: number
      readonly seat: PlayerId
      readonly view: PlayerView
      readonly actions: readonly LegalAction[]
      readonly seats: readonly SeatStatus[]
      readonly autoPassing: boolean
      readonly skipManaOnly: boolean
      readonly isHost: boolean
      readonly botSpeed: BotSpeed
    }
  | { readonly type: 'error'; readonly message: string }
