/**
 * The shared table for a card's tests — what nearly every `*.test.ts` here
 * builds for itself (a game, scripted seats, a board, a cast, a settle).
 * Start a new card test from this:
 *
 *   const { game, a } = table();                 // alice's turn 1, precombat main, her priority
 *   const bears = spawn(game, "Grizzly Bears", B); // on the battlefield, silently
 *   lands(game, "Wastes", 3);                     // mana for the cast
 *   pickTargets(a, bears);                        // what alice answers when asked
 *   cast(game, toHand(game, "Murder"));           // cast it, then settle the stack
 *   expect(zone(game, bears)).toBe("graveyard");
 *
 * The traps it closes, each of which has made a test pass without testing:
 *
 * - **A cast or activation the engine refuses.** `game.dispatch` of an
 *   illegal action can do nothing; `cast` and `activate` ask
 *   `game.canDispatch` first and throw its reason, with the step and the
 *   priority holder.
 * - **The target chooser's signature** is `(view, sourceName, specs,
 *   legalOptions)` — the second argument is a name, not the specs. `pickTargets`
 *   and `watchTargets` wrap it; `null` declines an optional slot.
 * - **An entry that fires nothing.** `spawn` is silent (no enters trigger —
 *   it's for setting up a board); `enter` announces the entry, so the card's
 *   own enters triggers fire. Use `enter` for the card under test.
 * - **Supertypes and types after layers.** `supertypes`/`types`/`subtypes`
 *   read the computed object (`supertypesOf`, `computeCharacteristics`), not
 *   the definition.
 *
 * Not built into `dist/` (tsconfig excludes `src/test/`).
 */
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import type { Action, LegalAction } from "../actions.js";
import type { Keyword } from "../cards/define.js";
import { supertypesOf } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";
import type { CardRegistry } from "../cards/card-registry.js";
import type { TargetRef, TargetSpec } from "../target.js";

export const A = asPlayerId("alice");
export const B = asPlayerId("bob");
export const C = asPlayerId("carol");
export const D = asPlayerId("dave");
const SEATS = [A, B, C, D];

export interface Table {
  readonly game: Game;
  /** Alice's, Bob's (and Carol's, Dave's) scripted seats: set their `…Fn`
   * hooks, or use the `pick*` helpers below. */
  readonly a: ScriptedController;
  readonly b: ScriptedController;
  readonly c: ScriptedController;
  readonly d: ScriptedController;
  readonly players: readonly PlayerId[];
}

/**
 * A game at alice's turn 1, `step` (default precombat main) with her priority:
 * `players` seats (2), each a 40-card library of `deck` (Wastes), `life` each
 * (20; 40 with `commander`). No first-turn draw skip, no land limit, no hand
 * limit — a test board, not a real opening.
 */
export function table(
  opts: {
    players?: 2 | 3 | 4;
    deck?: string;
    life?: number;
    seed?: number;
    step?: GameState["turn"]["step"];
  } = {},
): Table {
  const players = SEATS.slice(0, opts.players ?? 2);
  const seats = players.map((p) => new ScriptedController(p));
  const game = Game.create({
    seed: opts.seed ?? 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: opts.life ?? 20 },
    controllers: Object.fromEntries(players.map((p, i) => [p, seats[i]])),
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill(opts.deck ?? "Wastes") })),
  });
  const step = opts.step ?? "precombat-main";
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === step && s.priority.holder === A);
  // Unused seats get a controller that's never asked, so `c`/`d` are always there.
  const spare = (p: PlayerId): ScriptedController => new ScriptedController(p);
  return { game, a: seats[0], b: seats[1], c: seats[2] ?? spare(C), d: seats[3] ?? spare(D), players };
}

// ------------------------------------------------------------------ board

/** On the battlefield, silently (no enters trigger), not summoning sick. */
export const spawn = (game: Game, name: string, player: PlayerId = A, opts: { tapped?: boolean; sick?: boolean } = {}): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: opts.sick ?? false, tapped: opts.tapped });

/** Onto the battlefield **announcing the entry**, so its enters triggers
 * fire — then settled, unless `settle: false` (to look at the stack). */
export function enter(game: Game, name: string, player: PlayerId = A, opts: { settle?: boolean } = {}): ObjectId {
  const id = game.debugSpawn(name, player, "battlefield", { announceEntry: true, summoningSick: false });
  if (opts.settle !== false) settle(game);
  return id;
}

export const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
export const toHand = (game: Game, name: string, player: PlayerId = A): ObjectId => game.debugSpawn(name, player, "hand");
export const toGraveyard = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "graveyard");
export const toExile = (game: Game, name: string, player: PlayerId = A): ObjectId => game.debugSpawn(name, player, "exile");
/** On top of `player`'s library. */
export const toLibrary = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "library");

// ------------------------------------------------------------------ flow

/** Nothing on the stack, nothing asked, no trigger waiting. */
export const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Run until `quiet` — every answer from the seats' hooks. */
export const settle = (game: Game): void => game.advanceUntil(quiet);

function dispatchOrExplain(game: Game, action: Action): void {
  const why = game.canDispatch(action);
  if (why !== null) {
    const s = game.state;
    throw new Error(
      `${action.type} refused: ${why} (turn ${s.turn.number}, ${s.turn.step}, priority ${s.priority.holder ?? "none"})`,
    );
  }
  game.dispatch(action);
}

/**
 * Cast `card` for `player` (alice), then settle unless `settle: false`.
 * `targets` are the cast's chosen targets (`ref()` builds them); a spell
 * whose targets are chosen by the seat's hook can leave them out.
 */
export function cast(
  game: Game,
  card: ObjectId,
  opts: {
    player?: PlayerId;
    targets?: readonly (TargetRef | null)[];
    x?: number;
    modes?: readonly number[];
    settle?: boolean;
  } & Partial<Omit<Extract<Action, { type: "cast-spell" }>, "type" | "player" | "card" | "targets" | "xValue" | "modes">> = {},
): void {
  const { player = A, targets, x, modes, settle: andSettle = true, ...rest } = opts;
  dispatchOrExplain(game, {
    type: "cast-spell",
    player,
    card,
    targets: targets ?? [],
    ...(x !== undefined ? { xValue: x } : {}),
    ...(modes !== undefined ? { modes } : {}),
    ...rest,
  });
  if (andSettle) settle(game);
}

/** Activate `source`'s ability `index` (in `activated` order, 0 first). */
export function activate(
  game: Game,
  source: ObjectId,
  index = 0,
  opts: { player?: PlayerId; targets?: readonly (TargetRef | null)[]; x?: number; settle?: boolean } = {},
): void {
  const { player = A, targets, x, settle: andSettle = true } = opts;
  dispatchOrExplain(game, {
    type: "activate-ability",
    player,
    source,
    abilityIndex: index,
    targets: targets ?? [],
    ...(x !== undefined ? { xValue: x } : {}),
  } as Action);
  if (andSettle) settle(game);
}

/** Advance to `step` of the current or a later turn, with `player`'s
 * priority (alice's). */
export function toStep(game: Game, step: GameState["turn"]["step"], player: PlayerId = A): void {
  const from = game.state.turn.number;
  const atFrom = game.state.turn.step === step && game.state.priority.holder === player;
  game.advanceUntil(
    (s) => s.turn.step === step && s.priority.holder === player && (!atFrom || s.turn.number > from),
  );
}

/** The next turn's `step` (precombat main by default), whoever's turn it is. */
export function nextTurn(game: Game, step: GameState["turn"]["step"] = "precombat-main"): void {
  const from = game.state.turn.number;
  game.advanceUntil((s) => s.turn.number > from && s.turn.step === step && s.priority.holder === activePlayerOf(s));
}

/**
 * `attackers` (alice's) attack `defender` (bob) this turn: the attack is
 * scripted on `seat`, then the game runs to postcombat main — blocks from
 * the defending seat's hook (none by default), damage dealt.
 */
export function attack(
  game: Game,
  seat: ScriptedController,
  attackers: readonly ObjectId[],
  defender: PlayerId | ObjectId = B,
): void {
  seat.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender }));
  toStep(game, "postcombat-main", seat.playerId);
}

// ------------------------------------------------------------------ answers

/** A target reference: a player id or an object id. */
export const ref = (id: PlayerId | ObjectId): TargetRef =>
  (SEATS as readonly string[]).includes(id) ? { kind: "player", player: id as PlayerId } : { kind: "object", object: id as ObjectId };

/** The seat answers every target choice with these, in slot order; `null`
 * declines an optional slot. */
export function pickTargets(seat: ScriptedController, ...ids: readonly (PlayerId | ObjectId | null)[]): void {
  seat.chooseTargetsFn = () => ids.map((id) => (id === null ? null : ref(id)));
}

/**
 * Record what the seat is offered for each target slot (object and player
 * ids), answering with `answer` (declining every slot by default). Read
 * `.offered[slot]` after the choice — and check it was asked: `.asked`.
 */
export function watchTargets(
  seat: ScriptedController,
  answer: (offered: readonly (readonly string[])[], specs: readonly TargetSpec[]) => readonly (PlayerId | ObjectId | null)[] = (o) =>
    o.map(() => null),
): { offered: (readonly string[])[]; asked: number } {
  const seen = { offered: [] as (readonly string[])[], asked: 0 };
  seat.chooseTargetsFn = (_view, _sourceName, specs, legalOptions) => {
    seen.asked += 1;
    seen.offered = legalOptions.map((slot) => slot.map((t) => (t.kind === "object" ? t.object : t.player)));
    return answer(seen.offered, specs).map((id) => (id === null ? null : ref(id)));
  };
  return seen;
}

/** The seat chooses these modes (indices) whenever asked for modes — a `may`
 * is modes too: `pickModes(a, 0)` is "yes", `pickModes(a)` "no". */
export function pickModes(seat: ScriptedController, ...modes: readonly number[]): void {
  seat.chooseModesFn = () => [...modes];
}

/** The seat picks these permanents in a choose-permanents (and records what
 * was offered). */
export function pickPermanents(seat: ScriptedController, ...ids: readonly ObjectId[]): { offered: readonly ObjectId[] } {
  const seen = { offered: [] as readonly ObjectId[] };
  seat.choosePermanentsFn = (_view, eligible) => {
    seen.offered = eligible;
    return ids;
  };
  return seen;
}

/** The seat picks these cards in a choose-from-zone (look-and-choose,
 * search, a hand choice), recording what was eligible. */
export function pickFromZone(seat: ScriptedController, ...ids: readonly ObjectId[]): { offered: readonly ObjectId[] } {
  const seen = { offered: [] as readonly ObjectId[] };
  seat.chooseFromZoneFn = (_view, eligible) => {
    seen.offered = eligible;
    return ids;
  };
  return seen;
}

// ------------------------------------------------------------------ reads

/** The game's card registry (private on `Game`; tests read it). */
export const registryOf = (game: Game): CardRegistry => (game as unknown as { registry: CardRegistry }).registry;

export const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
export const controller = (game: Game, id: ObjectId): PlayerId => game.state.objects[id].controller;
export const pt = (game: Game, id: ObjectId): { power: number; toughness: number } => {
  const c = computeCharacteristics(game.state, registryOf(game), id);
  return { power: c.power ?? 0, toughness: c.toughness ?? 0 };
};
export const keywords = (game: Game, id: ObjectId): ReadonlySet<string> =>
  computeCharacteristics(game.state, registryOf(game), id).keywords;
export const types = (game: Game, id: ObjectId): readonly string[] => computeCharacteristics(game.state, registryOf(game), id).types;
export const subtypes = (game: Game, id: ObjectId): readonly string[] =>
  computeCharacteristics(game.state, registryOf(game), id).subtypes;
export const supertypes = (game: Game, id: ObjectId): readonly string[] =>
  supertypesOf(registryOf(game), game.state.objects[id]);
export const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
export const life = (game: Game, player: PlayerId = A): number => game.state.players[player].life;
export const hand = (game: Game, player: PlayerId = A): readonly ObjectId[] => game.state.zones.perPlayer[player].hand;
export const graveyard = (game: Game, player: PlayerId = A): readonly ObjectId[] =>
  game.state.zones.perPlayer[player].graveyard;
/** Tokens on the battlefield named `name` (a token stack counts as each of
 * its tokens), optionally only `player`'s. */
export function tokensNamed(game: Game, name: string, player?: PlayerId): number {
  return game.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.isToken && o.cardName === name && (player === undefined || o.controller === player))
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
}
/** Battlefield permanents named `name` (`player`'s, if given). */
export const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );

// ------------------------------------------------------------------ effects

/** Destroy `id` as though `by`'s (bob's) spell did — settled. */
export function destroy(game: Game, id: ObjectId, by: PlayerId = B): void {
  game.debugApplyEffect(by, { kind: "destroy", target: 0 }, [ref(id)]);
  settle(game);
}

/** `id` gains `keyword` until end of turn. */
export function grant(game: Game, id: ObjectId, keyword: Keyword): void {
  game.debugApplyEffect(controller(game, id), { kind: "grant-keyword", target: 0, keyword, duration: "end-of-turn" }, [
    ref(id),
  ]);
}

export type BlockOffer = Extract<LegalAction, { kind: "declare-blockers" }>;

/** `attackers` (`seat`'s) attack `defender` (bob); the game runs until the
 * defender is asked to block, and returns what they're offered. */
export function blockOffer(game: Game, seat: ScriptedController, attackers: readonly ObjectId[], defender: PlayerId = B): BlockOffer {
  seat.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender }));
  game.advanceUntil((s) => s.awaiting?.kind === "blockers");
  const offer = game.legalActions(defender).find((o): o is BlockOffer => o.kind === "declare-blockers");
  if (offer === undefined) throw new Error(`${defender} wasn't asked to block`);
  return offer;
}
