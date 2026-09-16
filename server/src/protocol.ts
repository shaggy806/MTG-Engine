/**
 * The wire protocol between a client device and the room server. Every
 * message is JSON over one WebSocket per connection.
 */

import type { Action, LegalAction, PlayerId, PlayerView } from "engine";

/** A deck as it travels over the wire — `claim-seat`, `add-bot`, and
 * `set-bot-deck` all carry one of these. `name` is a display label only (the
 * client's local deck name, or a starter deck's name); nothing server-side
 * keys off it. */
export interface WireDeck {
  readonly cards: readonly string[];
  readonly commander?: string;
  readonly name?: string;
  /** Which printing of each card this deck brings, keyed by card name — a
   * Scryfall card id (or any reference `CardDefinition.art` accepts). Purely
   * cosmetic; it rides through to `DeckList.printings` so every device in
   * the room draws the art its owner chose. Absent for a deck built before
   * the picker existed, or one that never left a card's default printing. */
  readonly printings?: Readonly<Record<string, string>>;
}

export interface SeatStatus {
  readonly player: PlayerId;
  /** Someone has claimed this seat (has a `clientToken` on file), regardless
   * of whether their connection is currently up. */
  readonly claimed: boolean;
  /** Whether the claiming connection is live right now. Only meaningful
   * when `claimed` — an unclaimed seat is never `online`. */
  readonly online: boolean;
  /** The claimer's chosen name, or `null` to fall back to the seat's own
   * label ("Alice", "Bob", ...). */
  readonly displayName: string | null;
  /** This seat is played by a basic heuristic bot, not a human — never
   * `claimed`/`online`. */
  readonly isBot: boolean;
  /** The deck this seat is bringing, so every device in the room (not just
   * this seat's own) can show it on the seat-picker screen — `null` before a
   * `PendingRoom` seat has resolved one (never true once `claimed` or
   * `isBot`, both of which always resolve a deck immediately). Always `null`
   * once the room is promoted to a real `Room`; nothing needs it once the
   * game itself is visible. */
  readonly deck: {
    readonly name: string;
    readonly commander: string | null;
    /** Which printing this deck brings for its commander, if it isn't the
     * default — just the one card, since the seat board only ever draws the
     * commander. The whole map travels with the deck itself. */
    readonly commanderPrinting: string | null;
  } | null;
  /** This seat has signaled it's ready to start (`set-ready`) — a bot seat
   * is always ready, since there's no human decision to wait on. The room
   * only promotes once every seat is ready (`start-game`), not the instant
   * the last seat is filled — see `PendingRoom.allReady`. Always `true` once
   * the room is promoted to a real `Room` (the concept is behind us by
   * then). */
  readonly ready: boolean;
  /** This seat's connection currently holds the host role (see `HostRole`).
   * `false` for every seat when the host hasn't claimed one. */
  readonly isHost: boolean;
}

/**
 * How long a room lets a bot's move sit on screen before the next one — a
 * pause on top of waiting for every client to finish animating it. Set by the
 * host (`set-bot-speed`); `"normal"` by default.
 */
export type BotSpeed = "fast" | "normal" | "slow";

export type ClientMessage =
  | {
      readonly type: "create-room";
      readonly seed?: number;
      /** How many seats the room should open with (2-4). Defaults to 2, which
       * is what the client sends — the table is sized on the seat board now
       * (`add-seat`/`remove-seat`), where you can see what a seat is. Kept as
       * a parameter for scripts and tests that want a 3-4 player room in one
       * step. */
      readonly players?: number;
      /** A secret the creating client keeps and presents on `join-room` to be
       * this room's host (see `HostRole`). Omitted means nobody is bound as
       * host, and the role falls to the first connected human seat. */
      readonly hostToken?: string;
    }
  | {
      readonly type: "join-room";
      readonly roomId: string;
      /** The token from this room's `create-room`, if this client created it
       * — binds this connection as the host. */
      readonly hostToken?: string;
    }
  | {
      readonly type: "claim-seat";
      readonly roomId: string;
      readonly seat: PlayerId;
      /** Persisted client-side (e.g. localStorage) so a refresh reclaims the same seat. */
      readonly clientToken: string;
      /** Omit to keep whatever name (if any) this seat already had — e.g. a
       * silent reconnect shouldn't blank out a name chosen earlier. */
      readonly displayName?: string;
      /** The deck to seed this seat with (built or picked in the client's
       * deck builder). Omitted — including a silent reconnect, which
       * shouldn't re-deal a fresh deck onto an already-seated player — falls
       * back to this seat's positional starter deck (`server/src/decks.ts`).
       * Only meaningful the first time a seat is claimed: the room's `Game`
       * doesn't exist yet at that point (see `PendingRoom`), so there's
       * nothing here to re-deal even if a later reconnect omitted it. */
      readonly deck?: WireDeck;
      /** Sets this seat's ready state as part of the same claim — lets the
       * seat-picker's "Ready" button claim-and-ready in one round trip the
       * first time a seat is filled. Omitted leaves `ready` at whatever it
       * already was (`false` for a brand new seat). A reclaim that also
       * changes `deck` is rejected while the seat is currently ready — see
       * `PendingRoom.claimSeat`; un-ready first (`set-ready`). */
      readonly ready?: boolean;
    }
  | {
      /** Fills an open seat with a basic heuristic bot instead of a human.
       * Host only. Omitted
       * `deck` falls back to that seat's positional starter deck, same as an
       * omitted `deck` on `claim-seat`. */
      readonly type: "add-bot";
      readonly roomId: string;
      readonly seat: PlayerId;
      readonly deck?: WireDeck;
    }
  | {
      /** Changes which deck an already-bot-filled seat is bringing — only
       * meaningful before the room's `Game` exists (a `PendingRoom`); once
       * promoted, decks are baked into the game and can't change. Host only. */
      readonly type: "set-bot-deck";
      readonly roomId: string;
      readonly seat: PlayerId;
      readonly deck: WireDeck;
    }
  | {
      /** Adds one more seat to a room that hasn't started yet — the seat
       * board's "Add seat" tile. How big the table is used to be answered on
       * the landing page, before anyone had seen a seat; it's asked here
       * instead, where the seats are visible and a wrong guess costs one
       * click to fix. Rejected once the table is full (four seats). Host only. */
      readonly type: "add-seat";
      readonly roomId: string;
    }
  | {
      /** Drops a seat from a room that hasn't started yet. Rejected below two
       * seats, and for a seat a human has claimed — that player leaving is
       * theirs to do. Host only. */
      readonly type: "remove-seat";
      readonly roomId: string;
      readonly seat: PlayerId;
    }
  | {
      /** Toggles the caller's own already-claimed seat between ready and not
       * — the seat-picker's "Ready"/"Un-ready" button once a deck's already
       * locked in. Only valid before the room's game exists. */
      readonly type: "set-ready";
      readonly roomId: string;
      readonly ready: boolean;
    }
  | {
      /** Explicitly starts the game once every seat is filled (bot or
       * claimed) and every human seat has readied up. Host only. Rejected
       * while any seat still isn't ready. */
      readonly type: "start-game";
      readonly roomId: string;
    }
  | {
      /** Sets how fast this room's bots play. Host only; allowed before and
       * during the game, and takes effect from the next bot move. */
      readonly type: "set-bot-speed";
      readonly roomId: string;
      readonly speed: BotSpeed;
    }
  | {
      readonly type: "dispatch";
      readonly roomId: string;
      readonly action: Action;
    }
  | {
      /**
       * Auto-pass this seat's own priority windows for the rest of the
       * current turn — never another seat's. Stops early if this seat is
       * asked for a real decision (blockers/discard/order-blockers).
       */
      readonly type: "pass-turn";
      readonly roomId: string;
    }
  | {
      /**
       * Toggles auto-passing this seat's own priority windows clean through
       * an opponent's turn too, stopping only once it's this seat's own turn
       * again (or a real decision comes up). Calling it again while already
       * active cancels it.
       */
      readonly type: "auto-pass";
      readonly roomId: string;
    }
  | {
      /**
       * Toggles a standing preference: skip this seat's own priority windows
       * where the only legal thing to do is tap for mana, same as one with
       * no options at all. Off by default, since holding priority with mana
       * up (and passing manually) is how a player bluffs having an instant.
       */
      readonly type: "toggle-mana-skip";
      readonly roomId: string;
    }
  | {
      /**
       * "I have finished showing frame `seq`" — sent once this client has
       * played out that push's animations and put its board on screen. The
       * room holds a bot's next move until every acking seat has caught up
       * (see `Room`'s frame gate), which is what keeps a bot from playing
       * three cards while the first one is still flying across the table.
       *
       * Seats that never ack simply don't participate in the gate, so an
       * older or headless client can't deadlock a room; a seat that acks and
       * then stalls is covered by the gate's own timeout instead.
       */
      readonly type: "ack";
      readonly roomId: string;
      readonly seq: number;
    };

export type ServerMessage =
  | { readonly type: "room-created"; readonly roomId: string }
  | {
      readonly type: "room-joined";
      readonly roomId: string;
      readonly seats: readonly SeatStatus[];
      /** Whether *this* connection holds the host role — true for a host who
       * hasn't claimed a seat, which no `SeatStatus.isHost` can say. */
      readonly isHost: boolean;
      readonly botSpeed: BotSpeed;
    }
  | {
      /** Pushed to every connected seat after a room is created/joined or any dispatch settles. */
      readonly type: "state";
      readonly roomId: string;
      /**
       * This push's frame number, counting up for the life of the room. A
       * client plays each frame's new events out in order and replies with
       * `ack` once the resulting board is on screen; the room uses those acks
       * to pace its bots (see `Room`). Every seat in a room sees the same
       * `seq` for the same frame.
       */
      readonly seq: number;
      readonly seat: PlayerId;
      readonly view: PlayerView;
      readonly actions: readonly LegalAction[];
      readonly seats: readonly SeatStatus[];
      /** Whether *this* seat currently has an auto-pass in effect. */
      readonly autoPassing: boolean;
      /** Whether *this* seat is currently skipping mana-only priority windows. */
      readonly skipManaOnly: boolean;
      /** Whether *this* connection holds the host role. */
      readonly isHost: boolean;
      readonly botSpeed: BotSpeed;
    }
  | { readonly type: "error"; readonly message: string };
