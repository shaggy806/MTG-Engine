/**
 * A `may` whose cost isn't only mana: "you may pay {W}{B} and 2 life. When
 * you do, …" (Zoraline, Cosmos Caller), "you may pay X life" (Tymna the
 * Weaver), "you may pay {E}{E}". `costLife` and `costEnergy` are read as the
 * `may` applies, the choice is offered only when every part can be paid
 * (life: at least that much — rule 119.4), and all of it is paid together as
 * the choice is made.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const registry = createDefaultRegistry().register(
  defineCard({
    name: "Test Graveyard Lure",
    manaCost: "{0}",
    types: ["artifact"],
    text: "",
  }),
);

const setUp = (players = [A, B]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const a = controllers[A] as ScriptedController;
  a.chooseModesFn = () => [0];
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
/** Apply `effect` as an ability of a permanent `alice` controls — a reflexive
 * trigger needs a real source to belong to. */
const run = (game: Game, effect: EffectSpec): void => {
  const source = game.debugSpawn("Test Graveyard Lure", A, "battlefield");
  game.debugApplyEffect(A, effect, [], { source });
  game.advanceUntil(quiet);
};
const lands = (game: Game, names: readonly string[]): ObjectId[] =>
  names.map((name) => game.debugSpawn(name, A, "battlefield"));
const life = (game: Game): number => game.state.players[A].life;
const offered = (game: Game): number => game.eventsOfType("modes-chosen").length;

describe("mana and life", () => {
  const zoraline: EffectSpec = {
    kind: "may",
    prompt: "Pay {W}{B} and 2 life?",
    cost: "{W}{B}",
    costLife: 2,
    effect: {
      kind: "reflexive-trigger",
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { manaValue: { op: "lte", n: 3 } } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      text: "When you do, return target card with mana value 3 or less from your graveyard to the battlefield.",
    },
  };

  it("pays all of it, and the 'when you do' follows", () => {
    const { game } = setUp();
    const paid = lands(game, ["Plains", "Swamp"]);
    const card = game.debugSpawn("Test Graveyard Lure", A, "graveyard");
    run(game, zoraline);
    expect(life(game)).toBe(18);
    expect(paid.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(game.state.objects[card].zone).toBe("battlefield");
  });

  it("isn't offered without the mana, and doesn't take the life", () => {
    const { game } = setUp();
    lands(game, ["Plains"]);
    run(game, zoraline);
    expect(offered(game)).toBe(0);
    expect(life(game)).toBe(20);
  });

  it("isn't offered without the life (rule 119.4) — the 'if you don't' applies", () => {
    const { game } = setUp();
    lands(game, ["Plains", "Swamp"]);
    game.state.players[A].life = 1;
    run(game, { ...zoraline, else: { kind: "draw", amount: 1 } } as EffectSpec);
    expect(offered(game)).toBe(0);
    expect(life(game)).toBe(1);
    expect(game.eventsOfType("card-drawn").length).toBeGreaterThan(0);
  });

  it("declining pays nothing", () => {
    const { game, a } = setUp();
    const untouched = lands(game, ["Plains", "Swamp"]);
    a.chooseModesFn = () => [];
    run(game, zoraline);
    expect(life(game)).toBe(20);
    expect(untouched.some((id) => game.state.objects[id].tapped)).toBe(false);
  });
});

describe("life as an amount, and energy", () => {
  it("'pay X life' reads X as the may applies", () => {
    const { game } = setUp([A, B, C]);
    const hand = game.handOf(A).length;
    run(game, {
      kind: "may",
      prompt: "Pay X life?",
      costLife: { countPlayers: "each-opponent" },
      effect: { kind: "draw", amount: { countPlayers: "each-opponent" } },
    });
    expect(life(game)).toBe(18);
    expect(game.handOf(A).length).toBe(hand + 2);
  });

  it("'pay {E}{E}' is offered only with two energy, and spends them", () => {
    const { game } = setUp();
    const payEnergy: EffectSpec = {
      kind: "may",
      prompt: "Pay {E}{E}?",
      costEnergy: 2,
      effect: { kind: "gain-life", amount: 5 },
    };
    run(game, { kind: "get-energy", amount: 1 });
    run(game, payEnergy);
    expect(life(game)).toBe(20);
    run(game, { kind: "get-energy", amount: 2 });
    run(game, payEnergy);
    expect(life(game)).toBe(25);
    expect(game.state.players[A].energy).toBe(1);
  });
});
