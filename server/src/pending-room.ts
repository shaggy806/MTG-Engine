/**
 * A room that exists (has a room code, accepts seat claims) but doesn't have
 * a `Game` yet — a waiting-room phase between "room created" and "game
 * started," needed now that a seat's deck isn't known until whoever claims
 * it actually connects (see `docs/plans/card-library-page.md`'s sibling deck-
 * builder plan). `Game.create` shuffles libraries and deals opening hands
 * immediately, for every seat, so it can't run until every seat's deck is
 * known — that's the one thing this class exists to wait for.
 *
 * Deliberately *not* a variant of `Room` (e.g. a nullable `game` field) —
 * `Room` is a heavily-used, already-tested class whose whole surface
 * (`dispatch`/`settle`/`addBot`/etc.) assumes a real `Game` exists. A pending
 * room needs none of that machinery (no dispatch, no settle, no bot turns) —
 * just the same seat-claiming bookkeeping `Room` already has, a small,
 * self-contained subset that's simpler to keep separate than to thread
 * null-checks through `Room`'s entire API for no benefit.
 */

import { createDefaultRegistry } from "engine";
import type { DeckList, GameConfig, PlayerId } from "engine";
import type { Connection } from "./room.js";
import type { SeatStatus } from "./protocol.js";
import { SEATS } from "./decks.js";

export interface PendingDeck {
  readonly cards: readonly string[];
  readonly commander?: string;
}

interface PendingSeat {
  readonly player: PlayerId;
  clientToken: string | null;
  connection: Connection | null;
  displayName: string | null;
  isBot: boolean;
  deck: PendingDeck | null;
}

const MAX_DISPLAY_NAME_LENGTH = 20;

/** Every card the registry knows, built once. */
const REGISTRY = createDefaultRegistry();

/** The maximum distinct unknown names worth naming back to the client — a
 * decklist built against an older pool could have dozens. */
const MAX_REPORTED_UNKNOWN = 5;

/**
 * A claimed deck has to be buildable *before* it is stored, because nothing
 * downstream can cope with a card the registry has never heard of: the deck
 * isn't touched again until `toGameConfig`, and `Game.create` then throws
 * deep inside promotion — at the instant the room's last seat fills, taking
 * the whole room down for everyone in it rather than the one player whose
 * deck is broken.
 *
 * This is a live risk rather than a theoretical one: a deck saved in a
 * browser's `localStorage` outlives any card the pool later renames or drops.
 */
function assertDeckIsBuildable(deck: PendingDeck): void {
  const unknown = [
    ...new Set(
      [...deck.cards, ...(deck.commander === undefined ? [] : [deck.commander])].filter(
        (name) => !REGISTRY.has(name),
      ),
    ),
  ];
  if (unknown.length === 0) return;
  const shown = unknown.slice(0, MAX_REPORTED_UNKNOWN).join(", ");
  const rest = unknown.length > MAX_REPORTED_UNKNOWN ? `, and ${unknown.length - MAX_REPORTED_UNKNOWN} more` : "";
  throw new Error(
    `deck contains ${unknown.length} card(s) this server doesn't know: ${shown}${rest}`,
  );
}

/** Config a `PendingRoom` needs up front — everything `GameConfig` wants
 * except `decks` (unknown until every seat is filled) and `startingPlayer`
 * (picked at promotion time instead of creation time, since "the highroll"
 * doesn't mean anything until the seats — and therefore the turn order —
 * are actually settled). */
export type PendingGameConfig = Omit<GameConfig, "decks" | "startingPlayer">;

export class PendingRoom {
  readonly id: string;
  private readonly config: PendingGameConfig;
  private readonly seats: PendingSeat[];
  private lastActivityAt: number;

  constructor(id: string, players: number, config: PendingGameConfig) {
    this.id = id;
    this.config = config;
    this.seats = SEATS.slice(0, players).map((s) => ({
      player: s.id,
      clientToken: null,
      connection: null,
      displayName: null,
      isBot: false,
      deck: null,
    }));
    this.lastActivityAt = Date.now();
  }

  idleMs(): number {
    return Date.now() - this.lastActivityAt;
  }

  seatStatuses(): SeatStatus[] {
    return this.seats.map((s) => ({
      player: s.player,
      claimed: s.clientToken !== null,
      online: s.connection !== null,
      displayName: s.displayName,
      isBot: s.isBot,
    }));
  }

  private seatFor(player: PlayerId): PendingSeat {
    const seat = this.seats.find((s) => s.player === player);
    if (seat === undefined) throw new Error(`no such seat: ${player}`);
    return seat;
  }

  private fallbackDeck(player: PlayerId): PendingDeck {
    const example = SEATS.find((s) => s.id === player);
    if (example === undefined) throw new Error(`no such seat: ${player}`);
    return { cards: example.cards, commander: example.commander };
  }

  /** Same claim/reclaim semantics as `Room.claimSeat` — a seat already
   * claimed by a *different* token is rejected even while offline; the same
   * token reclaims it. `deck`, when given, becomes this seat's deck;
   * omitted (or on a silent reconnect that doesn't resend it) falls back to
   * this seat's positional starter deck (`server/src/decks.ts`) so a bare
   * room-code link with nobody having visited the deck builder still works. */
  claimSeat(
    player: PlayerId,
    clientToken: string,
    connection: Connection,
    displayName?: string,
    deck?: PendingDeck,
  ): void {
    const seat = this.seatFor(player);
    if (seat.isBot) throw new Error(`seat ${player} is played by a bot`);
    if (seat.clientToken !== null && seat.clientToken !== clientToken) {
      throw new Error(`seat ${player} is already claimed`);
    }
    // Every rejection happens before the first mutation, so a refused claim
    // leaves the seat exactly as it was and the player can try another deck.
    if (deck !== undefined) assertDeckIsBuildable(deck);
    seat.connection = connection;
    seat.clientToken = clientToken;
    const trimmed = displayName?.trim();
    if (trimmed) {
      seat.displayName = trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH);
    }
    if (deck !== undefined) {
      seat.deck = deck;
    } else if (seat.deck === null) {
      seat.deck = this.fallbackDeck(player);
    }
    this.lastActivityAt = Date.now();
  }

  /** Fills `player`'s seat with a bot — same guards as `Room.addBot` — using
   * that seat's positional starter deck (no bot deck-picking UI). */
  addBot(player: PlayerId): void {
    const seat = this.seatFor(player);
    if (seat.clientToken !== null) throw new Error(`seat ${player} is already claimed`);
    if (seat.isBot) throw new Error(`seat ${player} already has a bot`);
    seat.isBot = true;
    seat.deck = this.fallbackDeck(player);
    this.lastActivityAt = Date.now();
  }

  seatOf(connection: Connection): PlayerId | null {
    return this.seats.find((s) => s.connection === connection)?.player ?? null;
  }

  disconnect(connection: Connection): void {
    const seat = this.seats.find((s) => s.connection === connection);
    if (seat !== undefined) seat.connection = null;
  }

  connectedSeats(): { readonly seat: PlayerId; readonly connection: Connection }[] {
    const out: { seat: PlayerId; connection: Connection }[] = [];
    for (const seat of this.seats) {
      if (seat.connection !== null) out.push({ seat: seat.player, connection: seat.connection });
    }
    return out;
  }

  /** Every seat is either claimed (which always resolves a deck — see
   * `claimSeat`) or bot-filled. */
  isReady(): boolean {
    return this.seats.every((s) => s.isBot || s.clientToken !== null);
  }

  /** The finished `GameConfig` — only meaningful once `isReady()`. Picks the
   * starting player (the "highroll") uniformly at random, same as the old
   * eager `create-room` handler did, just deferred to here. */
  toGameConfig(): GameConfig {
    const decks: DeckList[] = this.seats.map((s) => {
      if (s.deck === null) throw new Error(`seat ${s.player} has no deck yet`);
      return { player: s.player, cards: s.deck.cards, commander: s.deck.commander };
    });
    const startingPlayer = this.seats[Math.floor(Math.random() * this.seats.length)].player;
    return { ...this.config, decks, startingPlayer };
  }

  /** Every claimed seat that's *currently connected*, so a freshly-promoted
   * `Room` can have its live connection replayed onto it immediately rather
   * than waiting for a reconnect. A claimed-but-offline seat (rare — it
   * would take losing the connection in the same instant the room's last
   * seat fills) isn't included; its own stored session token still reclaims
   * it normally once it reconnects, same as any other disconnect. */
  claims(): {
    readonly player: PlayerId;
    readonly clientToken: string;
    readonly connection: Connection;
    readonly displayName: string | null;
  }[] {
    const out: {
      player: PlayerId;
      clientToken: string;
      connection: Connection;
      displayName: string | null;
    }[] = [];
    for (const s of this.seats) {
      if (s.clientToken !== null && s.connection !== null) {
        out.push({
          player: s.player,
          clientToken: s.clientToken,
          connection: s.connection,
          displayName: s.displayName,
        });
      }
    }
    return out;
  }

  /** Bot seats, so a freshly-promoted `Room` can have them filled the same
   * way without re-running `addBot`'s own guards. */
  botSeats(): readonly PlayerId[] {
    return this.seats.filter((s) => s.isBot).map((s) => s.player);
  }
}
