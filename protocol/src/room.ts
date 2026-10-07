/**
 * The room protocol: every message a client device and the room server send
 * each other, as JSON over one WebSocket per connection.
 *
 * This is the contract itself, imported by both sides rather than restated
 * on each. It used to be two hand-synced copies (`server/src/protocol.ts`
 * and `client/src/net/protocol.ts`) on the reasoning that a Node package and
 * a browser bundle can't share a module — but nothing here survives
 * compilation, so there was never anything to share *at runtime* to begin
 * with, and both workspaces already depend on `engine`.
 */

import type { Action, ArtManifestEntry, LegalAction, PlayerId, PlayerView, Step } from "engine";
import type { BuilderInfo, ScenarioSpec } from "./scenario.js";

/**
 * A player's standing priority-passing preferences — their own, kept on
 * their device and sent whenever they change (`set-pass-settings`). The
 * server does the passing (`Room.autoAdvanceHumanSeat`); none of them passes
 * a window with something on the stack, or answers a decision.
 */
export interface PassSettings {
  /** On your own turn, pass the upkeep and draw steps' windows. */
  readonly passToMain: boolean;
  /** Pass every combat step's window, on any turn. Declaring attackers and
   * blockers is still asked. */
  readonly passThroughCombat: boolean;
  /** Order your own simultaneous triggers (rule 603.3b, the engine's
   * `order-triggers` decision) rather than leave it to the engine. Absent
   * from a client older than the setting: off. */
  readonly orderTriggers?: boolean;
  /** Skip your own priority windows where the only legal thing to do is tap
   * for mana, same as one with no options at all. On unless turned off —
   * absent (a client older than the setting) is on too. Off is for a player
   * who wants to hold priority with mana up, to bluff an instant. */
  readonly skipManaOnly?: boolean;
  /** Steps whose first priority window you keep whatever passes it
   * otherwise (these settings, Auto-pass, Pass Turn) — on your own turns
   * (`mine`) and on everyone else's (`theirs`). */
  readonly stops: { readonly mine: readonly Step[]; readonly theirs: readonly Step[] };
}

/** A deck as it travels over the wire — `claim-seat`, `add-bot`, and
 * `set-bot-deck` all carry one of these. `name` is a display label only (the
 * client's local deck name, or a starter deck's name); nothing server-side
 * keys off it. */
export interface WireDeck {
  readonly cards: readonly string[];
  /** One or two commanders: two for a Partner pair, or a commander and its
   * Background (rule 903.3c). */
  readonly commanders?: readonly string[];
  readonly name?: string;
  /** Which printing of each card this deck brings, keyed by card name — a
   * Scryfall card id (or any reference `CardDefinition.art` accepts). Purely
   * cosmetic; it rides through to `DeckList.printings` so every device in
   * the room draws the art its owner chose. Absent for a deck built before
   * the picker existed, or one that never left a card's default printing. */
  readonly printings?: Readonly<Record<string, string>>;
}

/** A commander as the seat board shows it. */
export interface SeatCommander {
  readonly name: string;
  readonly printing: string | null;
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
    /** Its commanders — none, one, or a Partner pair — each with the printing
     * the deck brings for it, if that isn't the default. Only the commanders,
     * since they're all the seat board draws; the whole printings map travels
     * with the deck itself. */
    readonly commanders: readonly SeatCommander[];
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

/**
 * The host's choices for the game a waiting room will start, set before it
 * starts (`set-room-settings`) and shown to everyone in the room. Bot speed
 * is its own setting (`set-bot-speed`), since it stays adjustable mid-game.
 */
export interface RoomSettings {
  /** Each player's starting life total: 40 by default (rule 903.7), and
   * 1-999 (the server's check). */
  readonly startingLife: number;
  /** Who takes the first turn: `"random"` — the highroll, a seat drawn at
   * random as the game starts — or the seat the host picked. Back to
   * `"random"` if that seat is removed. */
  readonly firstPlayer: "random" | PlayerId;
}

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
      /** This seat's priority-passing preferences (`PassSettings`). */
      readonly type: "set-pass-settings";
      readonly roomId: string;
      readonly settings: PassSettings;
    }
  | {
      /** This connection's player concedes (rule 104.3a): they lose and
       * leave the game, and go on watching. A decision they owe is answered
       * by a bot first. Not during the opening hands. */
      readonly type: "concede";
      readonly roomId: string;
    }
  | {
      /** Hands this connection's seat to a bot (`on`), or takes it back. The
       * player keeps watching; their own actions are refused meanwhile. */
      readonly type: "bot-takeover";
      readonly roomId: string;
      readonly on: boolean;
    }
  | {
      /** Takes a seat in a waiting room without naming one: the token's own
       * seat if it holds one, else the first open seat, else a seat added
       * for it while the table has fewer than four (`PendingRoom.takeSeat`).
       * Un-readied. The `room-joined` that follows says which seat
       * (`seat`). What a device sends on arriving in a waiting room. */
      readonly type: "take-seat";
      readonly roomId: string;
      readonly clientToken: string;
      readonly displayName?: string;
      readonly deck?: WireDeck;
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
      /** Walks back out of a room that hasn't started yet — the seat board's
       * Back button. Frees the caller's seat, if it holds one, so the table
       * isn't left waiting on someone who has gone, and stops sending them
       * the waiting room. A host token is kept: the creator rejoining by the
       * code is the host again. Only valid before the room's game exists. */
      readonly type: "leave-room";
      readonly roomId: string;
    }
  | {
      /** Explicitly starts the game once every seat is filled (bot or
       * claimed) and every human seat has readied up. Host only. Rejected
       * while any seat still isn't ready. */
      readonly type: "start-game";
      readonly roomId: string;
    }
  | {
      /** Deals a new game into this room once its game is over, under the
       * same code: the same seats, players, decks and settings, a fresh
       * shuffle and (unless the host picked who goes first) a fresh
       * highroll. Everyone at the table is carried into it, with no seat
       * board in between; the new game's frames carry the next `game`
       * number. Host only, and only in a room whose frames say
       * `canRematch`. */
      readonly type: "rematch";
      readonly roomId: string;
      /** The host's "Restart game": deal it even though the game in
       * progress isn't over, which is otherwise refused (a rematch belongs
       * after a result, and a stray one mid-game would throw a game away). */
      readonly restart?: true;
    }
  | {
      /** Sets how fast this room's bots play. Host only; allowed before and
       * during the game, and takes effect from the next bot move. */
      readonly type: "set-bot-speed";
      readonly roomId: string;
      readonly speed: BotSpeed;
    }
  | {
      /** Changes some of the waiting room's `RoomSettings`; what's left out
       * stays as it was. Host only, and only before the game starts. */
      readonly type: "set-room-settings";
      readonly roomId: string;
      readonly settings: Partial<RoomSettings>;
    }
  | {
      /** Pauses or resumes this room's bots. Host only, and only once the
       * game is running. While paused no bot moves on (nor does a resolve-all
       * resolve its next object) until resumed, or stepped. */
      readonly type: "set-bots-paused";
      readonly roomId: string;
      readonly paused: boolean;
    }
  | {
      /** While the bots are paused, lets exactly one held move go. Host only. */
      readonly type: "step-bots";
      readonly roomId: string;
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
       * asked for a real decision (blockers, a discard, a damage split).
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
        * Pass this seat's priority repeatedly until the stack has drained —
        * a trigger-heavy turn otherwise asks for priority between every
        * object on it.
        *
        * **One-shot, not a mode**, which is what separates it from the three
        * above: it arms, the stack empties, and it disarms itself. Nothing is
        * remembered for the next stack.
        *
        * It stops the moment anything real happens rather than only when the
        * stack is empty — this seat being asked for a decision, an opponent
        * casting or activating into the window, a permanent this seat owns
        * leaving the battlefield, or anything of this seat's becoming a
        * target. It only ever passes *this* seat's priority; other seats
        * still pass their own, so on a table of humans it drains only as
        * fast as everyone else lets it.
        */
      readonly type: "resolve-all";
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
    }
  // --- capture (a server started with `--capture` only; see the `state`
  // message's `capture`) -----------------------------------------------------
  | {
      /** The room's recent bot decisions, to pick a blunder from. Answered
       * with `capture-list`. Host only. */
      readonly type: "capture-list";
      readonly roomId: string;
    }
  | {
      /** Everything the bot could have done at one of them. Answered with
       * `capture-options`. Host only. */
      readonly type: "capture-options";
      readonly roomId: string;
      readonly id: number;
    }
  | {
      /** Saves decision `id` as a training scenario: the right answer is
       * option `expect`, or anything but what the bot did. Answered with
       * `capture-saved`. Host only. */
      readonly type: "capture-save";
      readonly roomId: string;
      readonly id: number;
      readonly expect: number | "not-this";
      readonly note: string;
      readonly name?: string;
    }
  | {
      /** Files a bug report: the game as it stands, with what went wrong.
       * Answered with `capture-saved`. Host only. */
      readonly type: "capture-report";
      readonly roomId: string;
      readonly title: string;
      readonly description: string;
      /** A photo of what went wrong, as a PNG, JPEG, GIF or WebP data URL. */
      readonly image?: string;
    }
  // --- the scenario builder (a server started with `--builder` only; see
  // `scenario.ts` and the `state` message's `builder`) ------------------------
  | {
      /** Opens a scenario builder room, the creator its host and first seat.
       * Answered with `room-created`; the client then joins and claims a
       * seat as for any room. */
      readonly type: "builder-create";
      readonly hostToken: string;
    }
  | {
      /** Replaces the scenario being built and rebuilds the board from it.
       * Host only, while building. */
      readonly type: "builder-update";
      readonly roomId: string;
      readonly spec: ScenarioSpec;
    }
  | {
      /** Starts play from the scenario: a real game, bots in the seats it
       * names. Host only, while building. */
      readonly type: "builder-start";
      readonly roomId: string;
    }
  | {
      /** Back to building, from the scenario play started from. Host only,
       * while playing. */
      readonly type: "builder-stop";
      readonly roomId: string;
    }
  | {
      /** Back to building, from the game as it stands now. Host only, while
       * playing. */
      readonly type: "builder-snapshot";
      readonly roomId: string;
    }
  | {
      /** Moves this connection to another seat — any seat no one else holds
       * and no bot plays — so a developer can act for every side. */
      readonly type: "builder-seat";
      readonly roomId: string;
      readonly seat: PlayerId;
    };

/** One bot decision a capture-enabled room kept — see `capture-list`. */
export interface CaptureSummary {
  readonly id: number;
  readonly player: PlayerId;
  readonly turn: number;
  readonly step: string;
  /** `"priority"`, or the kind of decision it was answering. */
  readonly decision: string;
  /** What the bot did, in words. */
  readonly did: string;
}

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
      /** The waiting room's game settings. Absent once the game exists. */
      readonly settings?: RoomSettings;
      /** The seat *this* connection holds, if any — how a `take-seat` learns
       * which seat it was given. */
      readonly seat?: PlayerId | null;
      /** Whether the room is still the waiting room (no `Game` yet). */
      readonly pending?: boolean;
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
      /** Which game of this room the frame is from: 1 for the first, one
       * more for each `rematch`. `seq` keeps counting across a rematch, so
       * this is what tells a client the board is a new game's, to start
       * showing afresh rather than animate it as what the old game did
       * next. */
      readonly game: number;
      readonly seat: PlayerId;
      readonly view: PlayerView;
      readonly actions: readonly LegalAction[];
      readonly seats: readonly SeatStatus[];
      /** Whether *this* seat currently has an auto-pass in effect, paused or
       * not. */
      readonly autoPassing: boolean;
      /** Whether that auto-pass is paused: something the seat would want to
       * respond to happened, so its windows are its own until the stack is
       * clear again, when auto-pass resumes by itself. */
      readonly autoPassPaused: boolean;
      /** Whether *this* connection holds the host role. */
      readonly isHost: boolean;
      readonly botSpeed: BotSpeed;
      /** The host has paused the bots (`set-bots-paused`): shown to every
       * seat, so nobody wonders why the table stopped. */
      readonly botsPaused: boolean;
      /** The host picked who goes first (`RoomSettings.firstPlayer`), so
       * nobody won a highroll. Absent when the first player was drawn at
       * random. */
      readonly firstPlayerChosen?: true;
      /** This room can deal a `rematch` once its game is over: it was
       * started from a waiting room. Absent in a scenario builder's room or
       * one a script built. */
      readonly canRematch?: true;
      /** The engine threw while advancing this game, so the room stopped it
       * (`Room.stop`): why, in the engine's words. No move is taken after. */
      readonly stopped?: string;
      /** Present when this server captures bot decisions for training
       * scenarios — a developer's server, never the public site. */
      readonly capture?: true;
      /** Present in a scenario builder room — see `scenario.ts`. */
      readonly builder?: BuilderInfo;
      /** On a connection's first frame of a game only: every card in every
       * player's deck, as the art its tiles will ask for, for the client to
       * load quietly ahead of time (`artManifest` in the engine). It names
       * what's in each deck — accepted, for games among friends. */
      readonly artManifest?: readonly ArtManifestEntry[];
    }
  | { readonly type: "capture-list"; readonly entries: readonly CaptureSummary[] }
  | {
      readonly type: "capture-options";
      readonly id: number;
      readonly did: string;
      readonly options: readonly { readonly index: number; readonly text: string }[];
    }
  | { readonly type: "capture-saved"; readonly file: string }
  | { readonly type: "error"; readonly message: string };
