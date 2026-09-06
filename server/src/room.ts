/**
 * One in-progress game and the seats connected to it. Transport-agnostic —
 * a `Connection` is just "something we can push a `ServerMessage` to" — so
 * this is unit-testable without a real WebSocket.
 */

import { Game, actionPlayer, activePlayerOf, isSettled } from "engine";
import type { Action, GameState, PlayerId } from "engine";
import type { SeatStatus, ServerMessage } from "./protocol.js";

export interface Connection {
  readonly send: (message: ServerMessage) => void;
}

/**
 * How far a seat's auto-pass should carry: through the rest of the current
 * turn only ("Pass Turn"), or all the way through an opponent's turn too,
 * stopping only once it's this seat's own turn again ("Auto-pass").
 * `afterTurn` is the turn number in effect when requested, so "my turn"
 * means a *later* turn than that — not an already-current one.
 */
type AutoPassUntil =
  | { readonly kind: "rest-of-turn" }
  | { readonly kind: "next-own-turn"; readonly afterTurn: number };

interface Seat {
  readonly player: PlayerId;
  clientToken: string | null;
  connection: Connection | null;
  autoPassUntil: AutoPassUntil | null;
  /**
   * A standing preference (not a one-shot fast-forward): when set, this
   * seat's priority windows where the only thing to do is tap for mana are
   * skipped automatically, same as a window with no options at all. Off by
   * default so a player can still hold priority with mana up to bluff having
   * an instant — this is opt-in for players who don't care about that.
   */
  skipManaOnly: boolean;
  /** The claimer's chosen name, or `null` to fall back to the seat's own
   * label ("Alice", "Bob", ...). */
  displayName: string | null;
}

const SETTLE_BUDGET = 10_000;
const MAX_DISPLAY_NAME_LENGTH = 20;

export class Room {
  readonly id: string;
  readonly game: Game;
  private readonly seats: Seat[];

  constructor(id: string, game: Game) {
    this.id = id;
    this.game = game;
    this.seats = game.state.turnOrder.map((player) => ({
      player,
      clientToken: null,
      connection: null,
      autoPassUntil: null,
      skipManaOnly: false,
      displayName: null,
    }));
  }

  seatStatuses(): SeatStatus[] {
    return this.seats.map((s) => ({
      player: s.player,
      claimed: s.clientToken !== null,
      online: s.connection !== null,
      displayName: s.displayName,
    }));
  }

  private seatFor(player: PlayerId): Seat {
    const seat = this.seats.find((s) => s.player === player);
    if (seat === undefined) throw new Error(`no such seat: ${player}`);
    return seat;
  }

  /**
   * Binds `connection` to `player`. A seat already claimed by a *different*
   * token is rejected — even while that token's connection is currently
   * offline, so a dropped Wi-Fi connection can't hand the seat to a stranger
   * mid-reconnect. The same token reclaims it (e.g. a page refresh, or
   * genuinely coming back online). `displayName` is optional and, when
   * omitted, leaves whatever name (if any) this seat already had alone —
   * a silent reconnect shouldn't blank out a name chosen earlier.
   */
  claimSeat(
    player: PlayerId,
    clientToken: string,
    connection: Connection,
    displayName?: string,
  ): void {
    const seat = this.seatFor(player);
    if (seat.clientToken !== null && seat.clientToken !== clientToken) {
      throw new Error(`seat ${player} is already claimed`);
    }
    seat.connection = connection;
    seat.clientToken = clientToken;
    const trimmed = displayName?.trim();
    if (trimmed) {
      seat.displayName = trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH);
    }
  }

  seatOf(connection: Connection): PlayerId | null {
    return this.seats.find((s) => s.connection === connection)?.player ?? null;
  }

  /** Dispatches `action` on behalf of whichever seat `connection` claimed. */
  dispatch(connection: Connection, action: Action): void {
    const seat = this.seatOf(connection);
    if (seat === null) throw new Error("claim a seat before acting");
    if (actionPlayer(action) !== seat) {
      throw new Error(
        `cannot dispatch an action for ${actionPlayer(action)} from ${seat}'s seat`,
      );
    }
    this.game.dispatch(action);
    this.settle();
  }

  /**
   * Marks `connection`'s seat to auto-pass its own priority windows for the
   * rest of the current turn (never another seat's), stopping early if this
   * seat is asked for a real decision — including the turn's own `end` step,
   * which is a real priority window like any other, not a special stop.
   */
  requestPassTurn(connection: Connection): void {
    const player = this.seatOf(connection);
    if (player === null) throw new Error("claim a seat before acting");
    this.seatFor(player).autoPassUntil = { kind: "rest-of-turn" };
    this.settle();
  }

  /**
   * Toggles `connection`'s seat auto-passing its own priority windows clean
   * through an opponent's turn too, stopping only once it's this seat's own
   * turn again (or a real decision comes up). A second call while already
   * active cancels it instead of re-arming it.
   */
  requestAutoPass(connection: Connection): void {
    const player = this.seatOf(connection);
    if (player === null) throw new Error("claim a seat before acting");
    const seat = this.seatFor(player);
    seat.autoPassUntil =
      seat.autoPassUntil !== null
        ? null
        : { kind: "next-own-turn", afterTurn: this.game.state.turn.number };
    this.settle();
  }

  isAutoPassing(player: PlayerId): boolean {
    return this.seatFor(player).autoPassUntil !== null;
  }

  /**
   * Toggles `connection`'s seat auto-passing its own priority windows where
   * the only legal thing to do is tap for mana. A standing preference, not
   * a one-shot — stays in effect until toggled off again.
   */
  toggleSkipManaOnly(connection: Connection): void {
    const player = this.seatOf(connection);
    if (player === null) throw new Error("claim a seat before acting");
    const seat = this.seatFor(player);
    seat.skipManaOnly = !seat.skipManaOnly;
    this.settle();
  }

  isSkippingManaOnly(player: PlayerId): boolean {
    return this.seatFor(player).skipManaOnly;
  }

  /** Has `seat`'s auto-pass condition been reached? Clears it if so. */
  private clearAutoPassIfDone(seat: Seat, state: GameState): boolean {
    const until = seat.autoPassUntil;
    if (until === null) return false;
    const isMyTurnNow = activePlayerOf(state) === seat.player;
    const done =
      until.kind === "rest-of-turn"
        ? !isMyTurnNow
        : isMyTurnNow && state.turn.number > until.afterTurn;
    if (done) seat.autoPassUntil = null;
    return done;
  }

  /**
   * Advances the game one settled state at a time. At each stop: a plain
   * priority window with no other legal option skips itself for *any* seat
   * (there's no real choice to take away); a seat that opted in to skipping
   * mana-only windows also skips one where tapping for mana is the only
   * other option; a seat with an active auto-pass skips its own non-empty
   * windows too, until that condition clears. One hop per `advanceUntil`
   * call (never the cascading `autoSettle`) so a just-reached stopping point
   * can never be jumped over mid-cascade.
   */
  private settle(): void {
    for (let i = 0; i < SETTLE_BUDGET; i += 1) {
      this.game.advanceUntil(isSettled);
      const s = this.game.state;
      if (s.result.over) return;

      if (s.awaiting !== null) {
        const seat = this.seatFor(s.awaiting.player);
        const wasActive = seat.autoPassUntil !== null;
        const justCleared = this.clearAutoPassIfDone(seat, s);
        if (s.awaiting.kind === "attackers" && wasActive && !justCleared) {
          this.game.dispatch({
            type: "declare-attackers",
            player: seat.player,
            attackers: [],
          });
          continue;
        }
        return; // a real decision, or this seat's auto-pass condition was just met
      }

      const holder = s.priority.holder;
      if (holder === null) return;
      const seat = this.seatFor(holder);
      const wasActive = seat.autoPassUntil !== null;
      const justCleared = this.clearAutoPassIfDone(seat, s);

      const legal = this.game.legalActions(holder);
      const forcedPass = legal.length === 1 && legal[0].kind === "pass-priority";
      const manaOnlyAndSkipping = seat.skipManaOnly && this.game.isDeadForMana(holder);
      if (forcedPass || manaOnlyAndSkipping || (wasActive && !justCleared)) {
        this.game.dispatch({ type: "pass-priority", player: holder });
        continue;
      }
      return; // a real choice for whoever holds it
    }
    throw new Error("Room.settle did not settle; likely stuck in a loop");
  }

  disconnect(connection: Connection): void {
    const seat = this.seats.find((s) => s.connection === connection);
    if (seat !== undefined) seat.connection = null;
  }

  /** Every currently-connected seat, for pushing each its own redacted view. */
  connectedSeats(): { readonly seat: PlayerId; readonly connection: Connection }[] {
    const out: { seat: PlayerId; connection: Connection }[] = [];
    for (const seat of this.seats) {
      if (seat.connection !== null) out.push({ seat: seat.player, connection: seat.connection });
    }
    return out;
  }
}
