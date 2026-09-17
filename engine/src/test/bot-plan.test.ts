import { describe, expect, it } from "vitest";

import { canDeterminize, determinize, sampleWorlds } from "../bot/determinize.js";
import { rolloutPlan, scorePlan, searchTurnPlan } from "../bot/plan.js";
import { DEFAULT_WEIGHTS } from "../bot/evaluate.js";
import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { createRng } from "../primitives.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const registry = createDefaultRegistry();

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

const deck = (): string[] =>
  list([
    ["Forest", 20],
    ["Llanowar Elves", 4],
    ["Grizzly Bears", 6],
    ["Rumbling Baloth", 4],
    ["Craw Wurm", 3],
    ["Giant Growth", 3],
  ]);

/** A two-player game at Alice's precombat main, with `lands` already out and a
 * hand worth planning with. */
function planningPosition(lands = 5): Game {
  const game = Game.create({
    seed: 9,
    registry,
    decks: [A, B].map((player) => ({ player, cards: deck() })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (let i = 0; i < lands; i += 1) game.debugSpawn("Forest", A, "battlefield");
  game.debugSpawn("Grizzly Bears", A, "hand");
  game.debugSpawn("Forest", A, "hand");
  return game;
}

describe("determinization", () => {
  it("keeps every card a player owns, only moving it between hand and library", () => {
    const game = planningPosition();
    const before = game.state;
    const after = determinize(before, A, createRng(1));
    for (const player of [A, B] as PlayerId[]) {
      const pool = (s: typeof before) =>
        [...s.zones.perPlayer[player].hand, ...s.zones.perPlayer[player].library].sort();
      expect(pool(after), `${player} pool`).toEqual(pool(before));
      expect(after.zones.perPlayer[player].hand.length).toBe(
        before.zones.perPlayer[player].hand.length,
      );
    }
  });

  it("leaves our own hand alone but reshuffles our library", () => {
    // Our hand is known to us; its *contents* must survive, or the bot would be
    // planning with cards it doesn't have. Our library's order is not known, and
    // leaving it would keep the sharper half of the cheat — knowing our draws.
    const game = planningPosition();
    const after = determinize(game.state, A, createRng(7));
    expect(after.zones.perPlayer[A].hand).toEqual(game.state.zones.perPlayer[A].hand);
    expect(after.zones.perPlayer[A].library).not.toEqual(game.state.zones.perPlayer[A].library);
  });

  it("resamples an opponent's hand", () => {
    const game = planningPosition();
    const after = determinize(game.state, A, createRng(3));
    // Overwhelmingly likely to differ; if it ever matched by chance the pool
    // check above still guarantees correctness.
    expect(after.zones.perPlayer[B].hand).not.toEqual(game.state.zones.perPlayer[B].hand);
  });

  it("refuses a state with something mid-resolution", () => {
    const game = planningPosition();
    expect(canDeterminize(game.state)).toBe(true);
    const held = { ...game.state, zones: { ...game.state.zones, shared: { ...game.state.zones.shared, stack: [game.state.zones.perPlayer[A].hand[0]] } } };
    expect(canDeterminize(held)).toBe(false);
    expect(sampleWorlds(held, A, 3)).toHaveLength(0);
  });

  it("draws the same worlds for the same position, so replays stay exact", () => {
    const game = planningPosition();
    const once = sampleWorlds(game.state, A, 3).map((w) => JSON.stringify(w.zones.perPlayer[B].hand));
    const twice = sampleWorlds(game.state, A, 3).map((w) => JSON.stringify(w.zones.perPlayer[B].hand));
    expect(twice).toEqual(once);
  });
});

describe("turn plans", () => {
  it("plays the plan and then stops, rather than letting the policy finish the turn", () => {
    // The rule that gives a plan meaning: an omitted play means "I chose not
    // to", not "the policy will get to it". Without it every plan would end in
    // the same v1 turn — the collapse that killed per-action search.
    const game = planningPosition();
    const [world] = sampleWorlds(game.state, A, 1);
    expect(world).toBeDefined();
    const end = rolloutPlan(world, registry, A, [], game.state.turn.number, 1);
    expect(end).not.toBeNull();
    if (end === null) return;
    const mine = end.zones.shared.battlefield.filter((id) => end.objects[id].controller === A);
    const creatures = mine.filter(
      (id) => !registry.get(end.objects[id].cardName).types.includes("land"),
    );
    expect(creatures, "an empty plan must cast nothing on its own turn").toHaveLength(0);
  });

  it("scores different plans differently", () => {
    // The whole point of moving from actions to plans. Per-action search at a
    // real turn-8 position had eight of eleven candidates reaching a literally
    // identical end state.
    const game = planningPosition();
    const turn = game.state.turn.number;
    const worlds = sampleWorlds(game.state, A, 3);
    const landAction = game
      .legalActions(A)
      .find((l) => l.kind === "play-land");
    expect(landAction).toBeDefined();
    if (landAction === undefined || landAction.kind !== "play-land") return;
    const land = { type: "play-land" as const, player: A, card: landAction.card };

    const empty = scorePlan(worlds, registry, A, [], turn, 2, DEFAULT_WEIGHTS);
    const withLand = scorePlan(worlds, registry, A, [land], turn, 2, DEFAULT_WEIGHTS);
    expect(withLand).not.toBe(empty);
  });

  it("returns a plan whose actions are all legal, played in order", () => {
    const game = planningPosition();
    const { plan } = searchTurnPlan(game.state, registry, A, { worlds: 2, depth: 2 });
    expect(plan.length).toBeGreaterThan(0);
    // The real test of a plan: the engine accepts every step of it.
    for (const action of plan) {
      expect(() => game.dispatch(action), JSON.stringify(action)).not.toThrow();
    }
  });

  it("plans the land drop", () => {
    const game = planningPosition();
    const { plan } = searchTurnPlan(game.state, registry, A, { worlds: 2, depth: 2 });
    expect(plan.some((a) => a.type === "play-land")).toBe(true);
  });

  it("is deterministic for a given position", () => {
    const game = planningPosition();
    const once = searchTurnPlan(game.state, registry, A, { worlds: 2, depth: 2 });
    const twice = searchTurnPlan(game.state, registry, A, { worlds: 2, depth: 2 });
    expect(JSON.stringify(twice.plan)).toBe(JSON.stringify(once.plan));
    expect(twice.score).toBe(once.score);
  });

  it("falls back to no plan when the position can't be resampled", () => {
    const game = planningPosition();
    const held = {
      ...game.state,
      zones: {
        ...game.state.zones,
        shared: { ...game.state.zones.shared, stack: [game.state.zones.perPlayer[A].hand[0]] },
      },
    };
    const result = searchTurnPlan(held, registry, A, { worlds: 2, depth: 2 });
    expect(result.plan).toHaveLength(0);
    expect(result.keptHeuristic).toBe(true);
  });

  it("respects its evaluation budget", () => {
    const game = planningPosition();
    const result = searchTurnPlan(game.state, registry, A, {
      worlds: 1,
      depth: 1,
      maxEvaluations: 3,
    });
    expect(result.evaluations).toBeLessThanOrEqual(4);
  });
});
