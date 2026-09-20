/**
 * One in-progress game and the seats connected to it. Transport-agnostic —
 * a `Connection` is just "something we can push a `ServerMessage` to" — so
 * this is unit-testable without a real WebSocket.
 *
 * ## Frames, and why a bot doesn't get to play its whole turn at once
 *
 * Everything a room shows its clients travels as a **frame**: one numbered
 * `state` push carrying the board as it stands plus, implicitly, the events
 * that got it there since the previous frame. A client plays those events
 * out as animations, puts the resulting board on screen, and replies `ack`.
 *
 * That numbering exists because a bot used to take its entire turn inside a
 * single `settle()` call: land, spell, attack and pass all landed on the
 * client as one push, so the only picture of the board anybody ever saw was
 * the one *after* all of it, with the animations for how it got there
 * playing over a board that had already moved on. A land shown flying onto
 * the battlefield was already tapped for the spell that came after it.
 *
 * So `settle()` now stops at every bot decision instead of running through
 * it: it publishes a frame, waits for the acking seats to finish showing it
 * (`FRAME_ACK_TIMEOUT_MS` caps the wait, and a seat that has never acked
 * never gates anything, so no client can deadlock a room), and only then
 * lets the bot move. One bot action per frame, in lockstep with whatever is
 * on screen.
 *
 * `pacing: "immediate"` opts out of all of it — no bot delay, no gate, one
 * push at the end — which is what tests and scripts drive rooms with.
 */

import { EvalBotController, Game, actionPlayer, activePlayerOf, isSettled } from "engine";
import type { Action, AwaitingDecision, ControllerView, GameState, PlayerController, PlayerId } from "engine";
import { HostRole } from "./host.js";
import type { BotSpeed, SeatStatus, ServerMessage, WireDeck } from "./protocol.js";

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
  /** The highest frame this seat has reported finished showing. */
  ackedSeq: number;
  /** Whether this seat has *ever* acked. Only seats that have shown they
   * speak the ack half of the protocol are waited on, so a headless client,
   * an old build, or a test's fake connection can't wedge a room. */
  acksFrames: boolean;
}

/** How long the frame gate will wait on a seat that has acked before but has
 * gone quiet — a backgrounded tab throttles its timers, so its animations
 * (and therefore its acks) can slow right down. Past this the game moves on
 * without it rather than stalling for everyone else. */
const FRAME_ACK_TIMEOUT_MS = 6_000;
/** A floor on the gap between one bot action and the next, so a string of
 * moves with nothing animatable in them (passing priority round a table,
 * say) still reads as separate moves rather than one blur. */
const BOT_MIN_THINK_MS = 350;
/**
 * How long a bot may spend deciding one move.
 *
 * The v2 bot searches by simulating candidate moves, and a simulation's cost
 * grows with the board — on a wide four-player board a single rollout is
 * ~400ms, and worst-case decisions were measured at 2s (two players) and 14s
 * (four) before this existed. Its own `maxSimulations` ceiling counts
 * simulations, which bounds *work* and not *time*.
 *
 * Set a shade under `BOT_MIN_THINK_MS` so a bot's thinking disappears inside
 * the pause the room is already taking for animations: search and pause run
 * concurrently, so as long as the search finishes first it costs nothing
 * visible. The search returns its best candidate so far when the budget runs
 * out, having scored passing and v1's own choice first, so an expired search
 * degrades to v1-quality play rather than to nothing.
 */
const BOT_DECISION_BUDGET_MS = 300;
/**
 * How long a bot may spend planning one of its own turns.
 *
 * Deliberately much larger than `BOT_DECISION_BUDGET_MS`, because it buys
 * something different: v3 plans **once per turn** rather than once per priority
 * window, and a turn has several windows. Unbounded, the worst planned turn
 * measured 87 seconds (see `PlanBotOptions.planBudgetMs`).
 *
 * Unlike the per-decision budget this one doesn't disappear inside the
 * animation pause — it lands as a single hitch at the bot's first main phase,
 * and it blocks the whole process while it runs, so every other room on this
 * server waits too. A second is the compromise: the neighbour ordering puts
 * appends first, so a search cut short still returns a turn's worth of plays
 * rather than nothing, and a partial plan degrades to v1's turn rather than to
 * passing.
 */
export const BOT_PLAN_BUDGET_MS = 1_000;
/**
 * The host's bot speed, as a pause *after* every client has finished showing
 * a bot's move and before the next one. On top of the animation wait rather
 * than instead of it: a card play already holds the table for its whole
 * animation, but attacks, blocks and a land drop in a row went by faster than
 * a person could follow. `"fast"` is how rooms played before there was a
 * setting.
 */
const BOT_LINGER_MS: Readonly<Record<BotSpeed, number>> = {
  fast: 0,
  normal: 700,
  slow: 1_600,
};

const SETTLE_BUDGET = 10_000;
const MAX_DISPLAY_NAME_LENGTH = 20;

/** Swappable so tests can run a room's bot pacing on a fake clock. */
export interface RoomTimers {
  readonly setTimeout: (fn: () => void, ms: number) => unknown;
  readonly clearTimeout: (handle: unknown) => void;
}

const realTimers: RoomTimers = {
  setTimeout: (fn, ms) => {
    const handle = setTimeout(fn, ms);
    // A room idling on a bot's think timer shouldn't be what keeps the
    // process (or a test's event loop) alive.
    handle.unref?.();
    return handle;
  },
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface RoomOptions {
  /** Where this room's published frames go. The transport layer turns each
   * into a `state` push per connected seat (see `ws-server.ts`), and binds
   * it itself for any room it's handed — passing it here matters for a room
   * that publishes before its first message, which is every promoted one. */
  readonly onUpdate?: (room: Room) => void;
  /**
   * `"realtime"` (the default) paces bots against the clients' animations —
   * one bot action per frame, held until every acking seat has caught up.
   * `"immediate"` runs them to completion inside one `settle()` with a
   * single push at the end, which is what tests and scripts want.
   */
  readonly pacing?: "realtime" | "immediate";
  readonly timers?: RoomTimers;
  /** The waiting room's host role, carried across promotion. */
  readonly host?: HostRole;
  readonly botSpeed?: BotSpeed;
  /**
   * What `addBot` seats, overriding {@link DEFAULT_BOT}.
   *
   * For the pacing tests, which are about the frame/ack machinery and not
   * about how well anything plays: pinning the bot keeps them from breaking
   * every time a smarter one ships. That isn't hypothetical — v3 plans a whole
   * turn and will correctly decline to play a land on a deck where no land
   * could ever be spent, which is exactly the deck those tests use.
   */
  readonly botController?: (player: PlayerId) => PlayerController;
}

/**
 * The bot a live room seats: **v2**, the one-ply searching bot
 * (`docs/plans/smarter-bots.md`).
 *
 * v3 was seated here briefly on the argument that it is a strict delta over
 * v2 — it replaces priority windows on its own turn with a planned turn and
 * falls back to v2 everywhere else, so it cannot be worse. Both halves of that
 * turned out to be wrong, and the order in which they were found is the
 * lesson:
 *
 * - "Falls back to v2" was false in a live room. `settle` asked each bot for
 *   its move twice, which ate v3's plan two entries at a time until it passed
 *   every turn for the rest of the game (see `botAction`). Fixed, but it took
 *   a player reporting that the bots never played a land.
 * - Once it was working, it lost. Benched at four players against the mixed
 *   pod, 400 games each on shipped weights: **v2 27.9% [23.7, 32.5], v3 21.9%
 *   [18.1, 26.2]**, against an even share of 25%. Six points, p ~ 0.05, and v3
 *   is the only one of the two below par. v2 is also about 35% cheaper per
 *   game.
 *
 * v3 stays built and reachable through {@link RoomOptions.botController}; what
 * it needs before it is seated again is the evaluation work in
 * `docs/plans/bot-v3-search.md`, not another architectural argument.
 * {@link BOT_PLAN_BUDGET_MS} is kept for whoever seats it next.
 */
const DEFAULT_BOT = (player: PlayerId): PlayerController =>
  new EvalBotController(player, undefined, {
    timeBudgetMs: BOT_DECISION_BUDGET_MS,
  });

/** A bot move parked until the clients have finished showing the frame it
 * will act on. */
interface FrameGate {
  readonly run: () => void;
  /** The `BOT_MIN_THINK_MS` floor has elapsed. */
  minElapsed: boolean;
  minHandle: unknown;
  timeoutHandle: unknown;
  /** The bot-speed pause, once everyone has caught up. */
  lingerHandle: unknown;
}

export class Room {
  readonly id: string;
  readonly game: Game;
  private readonly seats: Seat[];
  private readonly bots = new Map<PlayerId, PlayerController>();
  private lastActivityAt: number;
  /** Mutable so a transport can bind itself to a room it didn't build — see
   * `RoomOptions.onUpdate`. */
  onUpdate: (room: Room) => void;
  private readonly pacing: "realtime" | "immediate";
  private readonly timers: RoomTimers;
  private readonly makeBot: (player: PlayerId) => PlayerController;
  private seq = 0;
  private gate: FrameGate | null = null;
  readonly host: HostRole;
  botSpeed: BotSpeed;

  constructor(id: string, game: Game, options: RoomOptions = {}) {
    this.id = id;
    this.game = game;
    this.host = options.host ?? new HostRole(null);
    this.botSpeed = options.botSpeed ?? "normal";
    this.onUpdate = options.onUpdate ?? (() => {});
    this.pacing = options.pacing ?? "realtime";
    this.timers = options.timers ?? realTimers;
    this.makeBot = options.botController ?? DEFAULT_BOT;
    this.seats = game.state.turnOrder.map((player) => ({
      player,
      clientToken: null,
      connection: null,
      autoPassUntil: null,
      skipManaOnly: false,
      displayName: null,
      ackedSeq: 0,
      acksFrames: false,
    }));
    this.lastActivityAt = Date.now();
  }

  /** The frame number of the most recent push — `ServerMessage.state.seq`. */
  get frameSeq(): number {
    return this.seq;
  }

  /** Settles a freshly-promoted room to the first thing anyone has to answer
   * and publishes that opening frame. */
  start(): void {
    this.settle();
  }

  /** Milliseconds since a seat was claimed or an action dispatched here —
   * used by `RoomManager` to reap abandoned rooms, which otherwise live in
   * memory for the life of the process with no expiry. */
  idleMs(): number {
    return Date.now() - this.lastActivityAt;
  }

  seatStatuses(): SeatStatus[] {
    return this.seats.map((s) => ({
      player: s.player,
      claimed: s.clientToken !== null,
      online: s.connection !== null,
      displayName: s.displayName,
      isBot: this.bots.has(s.player),
      // Once promoted to a real `Room`, every seat's deck is already baked
      // into `game.state` — the seat-picker screen that shows `deck` is
      // behind us, so there's nothing to report here.
      deck: null,
      // The ready/start-game dance is behind us too — every seat that's
      // going to play is, definitionally, already in.
      ready: true,
      isHost: s.connection !== null && s.connection === this.hostConnection(),
    }));
  }

  private humanSeats(): Seat[] {
    return this.seats.filter((s) => !this.bots.has(s.player));
  }

  private hostConnection(): Connection | null {
    return this.host.current(this.humanSeats());
  }

  /** Whether `connection` may take a host-only action — see `HostRole`. */
  isHost(connection: Connection): boolean {
    return this.host.allows(connection, this.humanSeats());
  }

  /** Binds `connection` as the host if it presents the room's host token. */
  bindHost(connection: Connection, hostToken: string | undefined): void {
    this.host.bind(connection, hostToken);
  }

  /** Takes effect from the next bot move; a move already waiting keeps the
   * pause it started with. */
  setBotSpeed(speed: BotSpeed): void {
    this.botSpeed = speed;
    this.lastActivityAt = Date.now();
  }

  /** Fills `player`'s seat with a searching bot instead of a human
   * connection — rejects a seat already claimed by a human or already
   * bot-controlled. Settles immediately afterward: the bot may already be
   * up to act (e.g. the mulligan phase, before any human has joined).
   * `deck` is accepted only for call-site symmetry with `PendingRoom.addBot`
   * (the seat-picker's deck choice) — an active `Room`'s decks are already
   * dealt, so it's ignored here. */
  addBot(player: PlayerId, deck?: WireDeck): void {
    void deck;
    const seat = this.seatFor(player);
    if (seat.clientToken !== null) throw new Error(`seat ${player} is already claimed`);
    if (this.bots.has(player)) throw new Error(`seat ${player} already has a bot`);
    this.bots.set(player, this.makeBot(player));
    this.lastActivityAt = Date.now();
    this.settle();
  }

  /** A bot's deck can only be changed before the game exists (see
   * `PendingRoom.setBotDeck`) — once promoted, decks are baked into `game.state`. */
  setBotDeck(_player: PlayerId, _deck: WireDeck): void {
    throw new Error("the game has already started — decks can't change now");
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
   * a silent reconnect shouldn't blank out a name chosen earlier. `deck` and
   * `ready` are accepted only for call-site symmetry with
   * `PendingRoom.claimSeat` (the seat-picker's deck choice / ready toggle) —
   * an active `Room`'s decks and readiness are both behind us, so they're
   * ignored here.
   */
  claimSeat(
    player: PlayerId,
    clientToken: string,
    connection: Connection,
    displayName?: string,
    deck?: WireDeck,
    ready?: boolean,
  ): void {
    void deck;
    void ready;
    const seat = this.seatFor(player);
    if (this.bots.has(player)) throw new Error(`seat ${player} is played by a bot`);
    if (seat.clientToken !== null && seat.clientToken !== clientToken) {
      throw new Error(`seat ${player} is already claimed`);
    }
    seat.connection = connection;
    seat.clientToken = clientToken;
    // A fresh connection hasn't shown anything yet, so it starts out not
    // gating: it re-earns that with its first ack on the push this claim is
    // about to trigger.
    seat.acksFrames = false;
    seat.ackedSeq = this.seq;
    const trimmed = displayName?.trim();
    if (trimmed) {
      seat.displayName = trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH);
    }
    this.lastActivityAt = Date.now();
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
    this.lastActivityAt = Date.now();
    this.settle();
  }

  /**
   * "I've finished showing frame `seq`." Recorded per seat and used purely
   * to pace bots (see the class comment) — never to gate anything a human
   * does, and deliberately not counted as activity for idle reaping, since
   * it's automatic client traffic rather than someone playing.
   */
  ack(connection: Connection, seq: number): void {
    const seat = this.seats.find((s) => s.connection === connection);
    if (seat === undefined) return;
    seat.acksFrames = true;
    if (seq > seat.ackedSeq) seat.ackedSeq = seq;
    this.tryOpenGate();
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

  /**
   * The bot seat (if any) that still owes a decision for `awaiting` right
   * now. Mulligan is answered in parallel (`awaiting.hands`, not a single
   * `awaiting.player` pointer — every seat still in `hands` may act) so it's
   * checked seat-by-seat; every other `awaiting` kind has one decider.
   */
  private nextBotDecider(awaiting: AwaitingDecision): PlayerId | null {
    if (awaiting.kind === "mulligan") {
      const stillDeciding = Object.keys(awaiting.hands) as PlayerId[];
      return stillDeciding.find((p) => this.bots.has(p)) ?? null;
    }
    return this.bots.has(awaiting.player) ? awaiting.player : null;
  }

  /** The bot seat that owes the game its next action right now, if any —
   * whether that's a raised decision or simply holding priority. */
  private currentBotActor(): PlayerId | null {
    const s = this.game.state;
    if (s.result.over) return null;
    if (s.awaiting !== null) return this.nextBotDecider(s.awaiting);
    const holder = s.priority.holder;
    return holder !== null && this.bots.has(holder) ? holder : null;
  }

  /**
   * What `seat`'s bot would do right now.
   *
   * **Asking costs something, and asking twice is a bug.** `act` is a
   * controller's decision entry point, not a pure function of the board:
   * v1 counts activations in it, v3 walks a turn plan through it, and both
   * advance that state whether or not the caller uses the answer. This used
   * to be asked once to decide whether the move was worth pacing and again
   * when it was time to make it — which quietly consumed v3's plan two
   * entries at a time until it ran out and passed every turn for the rest of
   * the game, and double-counted v1's per-turn activation cap. `settle` now
   * asks once and carries the answer (see the `eventSeq` check there).
   */
  private botAction(seat: PlayerId): Action {
    const bot = this.bots.get(seat);
    if (bot === undefined) throw new Error(`no bot on seat ${seat}`);
    const view: ControllerView = {
      state: this.game.state,
      player: seat,
      legalActions: () => this.game.legalActions(seat),
    };
    return bot.act(view);
  }

  /** Synthesizes and dispatches `seat`'s bot decision in-process — no
   * `Connection` involved, unlike a human seat's `dispatch`. */
  private dispatchForBot(seat: PlayerId): void {
    this.game.dispatch(this.botAction(seat));
    this.lastActivityAt = Date.now();
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
   * One human-seat auto-advance at the current stopping point: a plain
   * priority window with no other legal option skips itself for *any* seat
   * (there's no real choice to take away); a seat that opted in to skipping
   * mana-only windows also skips one where tapping for mana is the only
   * other option; a seat with an active auto-pass skips its own non-empty
   * windows too, until that condition clears. Returns whether it dispatched
   * something — i.e. whether the caller should look again.
   */
  private autoAdvanceHumanSeat(s: GameState): boolean {
    if (s.awaiting !== null) {
      const seat = this.seatFor(s.awaiting.player);
      const wasActive = seat.autoPassUntil !== null;
      const justCleared = this.clearAutoPassIfDone(seat, s);
      if (s.awaiting.kind === "attackers" && wasActive && !justCleared) {
        this.game.dispatch({ type: "declare-attackers", player: seat.player, attackers: [] });
        return true;
      }
      return false; // a real decision, or this seat's auto-pass just ran out
    }

    const holder = s.priority.holder;
    if (holder === null) return false;
    const seat = this.seatFor(holder);
    const wasActive = seat.autoPassUntil !== null;
    const justCleared = this.clearAutoPassIfDone(seat, s);

    const legal = this.game.legalActions(holder);
    const forcedPass = legal.length === 1 && legal[0].kind === "pass-priority";
    const manaOnlyAndSkipping = seat.skipManaOnly && this.game.isDeadForMana(holder);
    if (forcedPass || manaOnlyAndSkipping || (wasActive && !justCleared)) {
      this.game.dispatch({ type: "pass-priority", player: holder });
      return true;
    }
    return false; // a real choice for whoever holds it
  }

  /**
   * Advances the game one settled state at a time, stopping at the first
   * thing a human has to answer — or, in `"realtime"` pacing, at each bot
   * action, which is published as its own frame and then held behind the
   * frame gate (see the class comment). Always publishes exactly one frame
   * before it returns. One `advanceUntil` hop at a time (never the cascading
   * `autoSettle`) so a just-reached stopping point can never be jumped over
   * mid-cascade.
   */
  private settle(): void {
    // A bot move is already parked on the gate; it will resume the loop
    // itself once the clients have caught up. Whatever got us here (a human
    // answering a parallel mulligan, a seat arming auto-pass) still deserves
    // to be shown right away, and publishing extends the gate's wait to that
    // newer frame, which is exactly right.
    if (this.gate !== null) {
      this.publish();
      return;
    }

    for (let i = 0; i < SETTLE_BUDGET; i += 1) {
      this.game.advanceUntil(isSettled);
      const s = this.game.state;
      if (s.result.over) break;

      const bot = this.currentBotActor();
      if (bot !== null) {
        if (this.pacing === "immediate") {
          this.dispatchForBot(bot);
          continue;
        }
        // Asked exactly once for this move, then carried through the wait —
        // see `botAction` for what asking twice cost.
        const move = this.botAction(bot);
        if (this.game.isDeadForMana(bot) || move.type === "pass-priority") {
          // Nothing here a spectator could watch: passing priority, or
          // tapping for mana that casting would have tapped anyway. Spending
          // a frame and a think-time beat on these is worse than pointless —
          // it puts dead time *between* a spell being cast and that spell
          // resolving, which is exactly the gap that makes a creature seem to
          // appear well after its own play animation finished. Whatever the
          // move lets through lands in the next frame and is paced there.
          //
          // `isDeadForMana` short-circuits before `move` is read, but the bot
          // has already been asked either way, so dispatching `move` rather
          // than asking again is both correct and free.
          this.game.dispatch(move);
          this.lastActivityAt = Date.now();
          continue;
        }
        // Show the board this bot is about to act on, then let the clients
        // finish playing it before the bot touches anything.
        const decidedAt = this.game.state.eventSeq;
        this.publish();
        this.holdForClients(() => {
          // The game may have moved on while we waited (a human answering the
          // other half of a parallel mulligan, say). If it did, the move was
          // decided against a board that no longer exists and has to be
          // re-derived; if it didn't — the overwhelmingly common case — the
          // answer we already have is the right one, and asking again would
          // advance the bot's own state a second time.
          const stillUp = this.currentBotActor();
          if (stillUp === bot && this.game.state.eventSeq === decidedAt) {
            this.game.dispatch(move);
            this.lastActivityAt = Date.now();
          } else if (stillUp !== null) {
            this.dispatchForBot(stillUp);
          }
          this.settle();
        });
        return;
      }

      if (this.autoAdvanceHumanSeat(s)) continue;
      break;
    }
    this.publish();
  }

  /** Parks `run` until every acking seat has reported finishing the current
   * frame and the bot think-time floor has elapsed, whichever is later —
   * with `FRAME_ACK_TIMEOUT_MS` as a backstop for a seat that has gone
   * quiet. */
  private holdForClients(run: () => void): void {
    const gate: FrameGate = {
      run,
      minElapsed: false,
      minHandle: null,
      timeoutHandle: null,
      lingerHandle: null,
    };
    this.gate = gate;
    gate.minHandle = this.timers.setTimeout(() => {
      gate.minHandle = null;
      gate.minElapsed = true;
      this.tryOpenGate();
    }, BOT_MIN_THINK_MS);
    // Only worth arming if the floor above didn't already carry us straight
    // through the gate (a fake immediate clock in tests does exactly that).
    if (this.gate === gate) {
      gate.timeoutHandle = this.timers.setTimeout(() => {
        gate.timeoutHandle = null;
        this.openGate();
      }, FRAME_ACK_TIMEOUT_MS);
    }
  }

  /** Every seat that gates (connected, and has acked at least once) has
   * reported finishing the frame we're currently showing. */
  private everyoneCaughtUp(): boolean {
    return this.seats.every(
      (s) => s.connection === null || !s.acksFrames || s.ackedSeq >= this.seq,
    );
  }

  private tryOpenGate(): void {
    const gate = this.gate;
    if (gate === null || !gate.minElapsed || !this.everyoneCaughtUp()) return;
    if (gate.lingerHandle !== null) return; // already pausing
    const linger = BOT_LINGER_MS[this.botSpeed];
    if (linger === 0) {
      this.openGate();
      return;
    }
    // Everyone has seen the move; the ack timeout has done its job, and
    // shouldn't cut the pause short.
    if (gate.timeoutHandle !== null) {
      this.timers.clearTimeout(gate.timeoutHandle);
      gate.timeoutHandle = null;
    }
    gate.lingerHandle = this.timers.setTimeout(() => {
      gate.lingerHandle = null;
      this.openGate();
    }, linger);
  }

  private openGate(): void {
    const gate = this.gate;
    if (gate === null) return;
    this.gate = null;
    if (gate.minHandle !== null) this.timers.clearTimeout(gate.minHandle);
    if (gate.timeoutHandle !== null) this.timers.clearTimeout(gate.timeoutHandle);
    if (gate.lingerHandle !== null) this.timers.clearTimeout(gate.lingerHandle);
    gate.run();
  }

  /** Numbers and hands out the next frame. The single path to a `state`
   * push — `ws-server.ts` turns one of these into one message per connected
   * seat — so every seat always sees the same frame under the same `seq`. */
  publish(): void {
    this.seq += 1;
    this.onUpdate(this);
  }

  disconnect(connection: Connection): void {
    this.host.drop(connection);
    const seat = this.seats.find((s) => s.connection === connection);
    if (seat !== undefined) {
      seat.connection = null;
      seat.acksFrames = false;
      // Whoever just dropped may have been the seat the gate was waiting on.
      this.tryOpenGate();
    }
  }

  /** Drops any parked bot move and its timers — for a room being reaped, so
   * nothing keeps firing against a game nobody is watching. */
  dispose(): void {
    const gate = this.gate;
    if (gate === null) return;
    this.gate = null;
    if (gate.minHandle !== null) this.timers.clearTimeout(gate.minHandle);
    if (gate.timeoutHandle !== null) this.timers.clearTimeout(gate.timeoutHandle);
    if (gate.lingerHandle !== null) this.timers.clearTimeout(gate.lingerHandle);
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
