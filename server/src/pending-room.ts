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

import { commandersOf, createDefaultRegistry } from "engine";
import type { DeckList, GameConfig, PlayerId } from "engine";
import type { Connection } from "./room.js";
import { HostRole } from "./host.js";
import type { BotSpeed, SeatStatus, WireDeck } from "protocol";
import { SEATS } from "./decks.js";

export type PendingDeck = WireDeck;

interface PendingSeat {
  readonly player: PlayerId;
  clientToken: string | null;
  connection: Connection | null;
  displayName: string | null;
  isBot: boolean;
  deck: PendingDeck | null;
  /** Signaled ready via `set-ready` (or `claimSeat`'s own `ready` param) —
   * meaningless for a bot seat, which is always reported ready (see
   * `seatStatuses`/`allReady`). */
  ready: boolean;
}

const MAX_DISPLAY_NAME_LENGTH = 20;

/** A table is 2-4 seats: `SEATS` caps the top (four named seats, in seating
 * order) and Magic needs an opponent. Both ends are enforced by
 * `addSeat`/`removeSeat` rather than only by the client's own buttons, since
 * anyone in the room can send either message. */
const MIN_SEATS = 2;

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
  assertPrintingsAreSafe(deck);
  const commanders = commandersOf(deck);
  // A game has room for one commander, or two (rule 903.3c); more would reach
  // `Game.create` and fail there, at promotion, for the whole table.
  if (commanders.length > 2) {
    throw new Error(`a deck has at most two commanders, this one names ${commanders.length}`);
  }
  const unknown = [
    ...new Set([...deck.cards, ...commanders].filter((name) => !REGISTRY.has(name))),
  ];
  if (unknown.length === 0) return;
  const shown = unknown.slice(0, MAX_REPORTED_UNKNOWN).join(", ");
  const rest = unknown.length > MAX_REPORTED_UNKNOWN ? `, and ${unknown.length - MAX_REPORTED_UNKNOWN} more` : "";
  throw new Error(
    `deck contains ${unknown.length} card(s) this server doesn't know: ${shown}${rest}`,
  );
}

/** A Scryfall card id — the only thing a `printings` entry may be. */
const SCRYFALL_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A deck's chosen printings end up as `VisibleObject.art` in *every* seat's
 * view, and the client turns that into an `<img src>` — so a value here is a
 * URL this server hands other people's browsers to fetch. `resolveArtUrl`
 * accepts a bare id, a Scryfall page/API link, *or* any other absolute URL
 * used verbatim, which would let one player point a table's card art at a
 * host they control and collect everyone's IP address from it.
 *
 * So only the narrowest form is accepted over the wire: a bare Scryfall card
 * id, which is what the deck builder's picker stores anyway. A card's own
 * `CardDefinition.art` can still be any of the richer shapes — that's
 * authored in this repo, not sent by a client.
 */
function assertPrintingsAreSafe(deck: PendingDeck): void {
  if (deck.printings === undefined) return;
  for (const [name, id] of Object.entries(deck.printings)) {
    if (typeof id !== "string" || !SCRYFALL_ID_RE.test(id)) {
      throw new Error(`deck has an invalid printing for "${name}" — expected a Scryfall card id`);
    }
  }
}

/** Where a seat sits in the printed seating order (`SEATS`), which is the
 * turn order a promoted room ends up with — see `toGameConfig`. */
function seatOrder(player: PlayerId): number {
  return SEATS.findIndex((s) => s.id === player);
}

function emptySeat(player: PlayerId): PendingSeat {
  return {
    player,
    clientToken: null,
    connection: null,
    displayName: null,
    isBot: false,
    deck: null,
    ready: false,
  };
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
  /** Carried onto the promoted `Room` — see `HostRole`. */
  readonly host: HostRole;
  botSpeed: BotSpeed = "normal";

  constructor(id: string, players: number, config: PendingGameConfig, hostToken?: string) {
    this.id = id;
    this.config = config;
    this.host = new HostRole(hostToken ?? null);
    this.seats = SEATS.slice(0, players).map((s) => emptySeat(s.id));
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
      deck:
        s.deck === null
          ? null
          : {
              name: s.deck.name ?? "Custom deck",
              commanders: commandersOf(s.deck).map((name) => ({
                name,
                printing: s.deck?.printings?.[name] ?? null,
              })),
            },
      ready: s.isBot || s.ready,
      isHost: s.connection !== null && s.connection === this.hostConnection(),
    }));
  }

  private humanSeats(): PendingSeat[] {
    return this.seats.filter((s) => !s.isBot);
  }

  private hostConnection(): Connection | null {
    return this.host.current(this.humanSeats());
  }

  /** Whether `connection` may take a host-only action — see `HostRole`. */
  isHost(connection: Connection): boolean {
    return this.host.allows(connection, this.humanSeats());
  }

  bindHost(connection: Connection, hostToken: string | undefined): void {
    this.host.bind(connection, hostToken);
  }

  setBotSpeed(speed: BotSpeed): void {
    this.botSpeed = speed;
    this.lastActivityAt = Date.now();
  }

  /** The host's connection when they haven't claimed a seat — everyone
   * `connectedSeats` misses who still needs the waiting room kept current. */
  unseatedHost(): Connection | null {
    return this.host.unseatedConnection(this.seats);
  }

  private seatFor(player: PlayerId): PendingSeat {
    const seat = this.seats.find((s) => s.player === player);
    if (seat === undefined) throw new Error(`no such seat: ${player}`);
    return seat;
  }

  private fallbackDeck(player: PlayerId): PendingDeck {
    const example = SEATS.find((s) => s.id === player);
    if (example === undefined) throw new Error(`no such seat: ${player}`);
    return { cards: example.cards, commander: example.commander, name: example.name };
  }

  /** Same claim/reclaim semantics as `Room.claimSeat` — a seat already
   * claimed by a *different* token is rejected even while offline; the same
   * token reclaims it, which is also how the seat-picker updates an
   * already-claimed seat's deck (resending `claimSeat` with the same token
   * and a new `deck`) — rejected while the seat is currently ready; un-ready
   * (`setReady`) first. `deck`, when given, becomes this seat's deck;
   * omitted (or on a silent reconnect that doesn't resend it) falls back to
   * this seat's positional starter deck (`server/src/decks.ts`) so a bare
   * room-code link with nobody having visited the deck builder still works.
   * `ready`, when given, sets this seat's ready state as part of the same
   * call — lets a first-time claim also ready up in one round trip. */
  claimSeat(
    player: PlayerId,
    clientToken: string,
    connection: Connection,
    displayName?: string,
    deck?: PendingDeck,
    ready?: boolean,
  ): void {
    const seat = this.seatFor(player);
    if (seat.isBot) throw new Error(`seat ${player} is played by a bot`);
    if (seat.clientToken !== null && seat.clientToken !== clientToken) {
      throw new Error(`seat ${player} is already claimed`);
    }
    // Every rejection happens before the first mutation, so a refused claim
    // leaves the seat exactly as it was and the player can try another deck.
    if (deck !== undefined) {
      if (seat.ready) throw new Error(`seat ${player} is readied up — un-ready before changing decks`);
      assertDeckIsBuildable(deck);
    }
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
    if (ready !== undefined) seat.ready = ready;
    this.lastActivityAt = Date.now();
  }

  /**
   * Adds one more seat, taking the first of `SEATS` not already at the table
   * and keeping the seats in `SEATS` order afterwards — so turn order is
   * always the printed seating order however the table was assembled, and
   * dropping the third seat of four then adding one back gives the same table
   * it started from rather than a reshuffled one. Returns the new seat.
   */
  addSeat(): PlayerId {
    const taken = new Set(this.seats.map((s) => s.player));
    const next = SEATS.find((s) => !taken.has(s.id));
    if (next === undefined) throw new Error(`a table seats at most ${SEATS.length}`);
    this.seats.push(emptySeat(next.id));
    this.seats.sort((a, b) => seatOrder(a.player) - seatOrder(b.player));
    this.lastActivityAt = Date.now();
    return next.id;
  }

  /** Drops a seat. A seat a human holds is never pulled out from under them
   * — leaving is that player's own call — but the host may remove an open or
   * bot-filled one. */
  removeSeat(player: PlayerId): void {
    const index = this.seats.findIndex((s) => s.player === player);
    if (index === -1) throw new Error(`no such seat: ${player}`);
    if (this.seats.length <= MIN_SEATS) throw new Error(`a game needs at least ${MIN_SEATS} seats`);
    if (this.seats[index].clientToken !== null) throw new Error(`seat ${player} is claimed by a player`);
    this.seats.splice(index, 1);
    this.lastActivityAt = Date.now();
  }

  /** Toggles `connection`'s own already-claimed seat's ready state — the
   * seat-picker's "Ready"/"Un-ready" control once a deck's already locked
   * in. Rejects a connection that hasn't claimed a seat here. */
  setReady(connection: Connection, ready: boolean): void {
    const player = this.seatOf(connection);
    if (player === null) throw new Error("claim a seat before readying up");
    this.seatFor(player).ready = ready;
    this.lastActivityAt = Date.now();
  }

  /** Fills `player`'s seat with a bot — same guards as `Room.addBot`. `deck`,
   * when given, becomes the bot's deck (validated the same way a human
   * claim's deck is); omitted falls back to that seat's positional starter
   * deck. */
  addBot(player: PlayerId, deck?: PendingDeck): void {
    const seat = this.seatFor(player);
    if (seat.clientToken !== null) throw new Error(`seat ${player} is already claimed`);
    if (seat.isBot) throw new Error(`seat ${player} already has a bot`);
    if (deck !== undefined) assertDeckIsBuildable(deck);
    seat.isBot = true;
    seat.deck = deck ?? this.fallbackDeck(player);
    this.lastActivityAt = Date.now();
  }

  /** Changes an already-bot-filled seat's deck — the seat-picker's "pick
   * which deck this bot plays" control. Rejects a seat that isn't currently
   * a bot (a human's own deck is only set via `claimSeat`). */
  setBotDeck(player: PlayerId, deck: PendingDeck): void {
    const seat = this.seatFor(player);
    if (!seat.isBot) throw new Error(`seat ${player} isn't played by a bot`);
    assertDeckIsBuildable(deck);
    seat.deck = deck;
    this.lastActivityAt = Date.now();
  }

  /** `connection` walking out of the waiting room: its seat, if it holds
   * one, goes back to open — token, deck, name and ready state with it, so
   * the next person to take it starts clean — and it stops being the host
   * here until it rejoins with the host token. */
  leave(connection: Connection): void {
    this.host.drop(connection);
    const index = this.seats.findIndex((s) => s.connection === connection);
    if (index !== -1) this.seats[index] = emptySeat(this.seats[index].player);
    this.lastActivityAt = Date.now();
  }

  seatOf(connection: Connection): PlayerId | null {
    return this.seats.find((s) => s.connection === connection)?.player ?? null;
  }

  disconnect(connection: Connection): void {
    this.host.drop(connection);
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
   * `claimSeat`) or bot-filled — every seat has somewhere to deal a hand
   * from, but says nothing about whether anyone's actually ready to start
   * (see `allReady`). */
  isReady(): boolean {
    return this.seats.every((s) => s.isBot || s.clientToken !== null);
  }

  /** Every seat is bot-filled, or claimed *and* readied up — the gate on
   * `start-game`. Stricter than `isReady`: a table can be entirely filled
   * and still not start until every human seat says go. */
  allReady(): boolean {
    return this.seats.every((s) => s.isBot || (s.clientToken !== null && s.ready));
  }

  /** The finished `GameConfig` — only meaningful once `isReady()`. Picks the
   * starting player (the "highroll") uniformly at random, same as the old
   * eager `create-room` handler did, just deferred to here. */
  toGameConfig(): GameConfig {
    const decks: DeckList[] = this.seats.map((s) => {
      if (s.deck === null) throw new Error(`seat ${s.player} has no deck yet`);
      return {
        player: s.player,
        cards: s.deck.cards,
        commanders: commandersOf(s.deck),
        printings: s.deck.printings,
      };
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
