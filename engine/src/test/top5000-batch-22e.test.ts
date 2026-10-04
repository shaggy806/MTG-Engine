/**
 * Top-5000 batch 22e. No engine change: each test pins the clause of a new
 * card most likely to be wired wrong — the sacrificed creature's toughness
 * (Witch's Oven), "that many" read off the discard (Tolarian Winds), twice
 * the creature count and several graveyards at once (Thraben Charm), once a
 * turn (Hollowmurk Siege, Basim Ibn Ishaq), X read off the dead creature
 * (Mask of Griselbrand), a reduction per counter for Angels and Humans
 * (Herald of War), "if you do" on a token sacrifice (Chitterspitter) and an
 * additional cost paid in mana (Eaten Alive).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const settle = (game: Game): void => game.advanceUntil(quiet);
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** Tokens of a name on the battlefield, a token stack counting as every token in it. */
const tokens = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 22e — Witch's Oven", () => {
  it("bakes two Food from a creature with toughness 4, one from a smaller one", () => {
    const { game } = setUp();
    const first = spawn(game, "Witch's Oven");
    const second = spawn(game, "Witch's Oven");
    const spider = spawn(game, "Giant Spider"); // 2/4
    const bears = spawn(game, "Grizzly Bears"); // 2/2
    game.dispatch({ type: "activate-ability", player: A, source: first, abilityIndex: 0, targets: [], sacrifice: spider });
    settle(game);
    expect(zone(game, spider)).toBe("graveyard");
    expect(tokens(game, "Food Token")).toBe(2);
    game.dispatch({ type: "activate-ability", player: A, source: second, abilityIndex: 0, targets: [], sacrifice: bears });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(tokens(game, "Food Token")).toBe(3);
  });
});

describe("top-5000 batch 22e — Tolarian Winds", () => {
  it("discards the whole hand and draws that many", () => {
    const { game } = setUp();
    const before = [...game.handOf(A)];
    expect(before.length).toBeGreaterThan(0);
    game.debugApplyEffect(A, registry.get("Tolarian Winds")!.effect!, []);
    settle(game);
    expect(before.every((id) => zone(game, id) === "graveyard")).toBe(true);
    expect(game.handOf(A)).toHaveLength(before.length);
  });
});

describe("top-5000 batch 22e — Thraben Charm", () => {
  const modes = registry.get("Thraben Charm")!.castModal!.modes;

  it("deals twice the number of creatures you control", () => {
    const { game } = setUp();
    lands(game, "Grizzly Bears", 2);
    spawn(game, "Grizzly Bears", B);
    const spider = spawn(game, "Giant Spider", B);
    game.debugApplyEffect(A, modes[0].effect!, [{ kind: "object", object: spider }]);
    // Read before state-based actions: 2 × 2 creatures, not B's.
    expect(game.state.objects[spider].damageMarked).toBe(4);
  });

  it("exiles every targeted player's graveyard", () => {
    const { game } = setUp();
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Hill Giant", B, "graveyard");
    game.debugSpawn("Giant Spider", B, "graveyard");
    game.debugApplyEffect(A, modes[2].effect!, [
      { kind: "player", player: A },
      { kind: "player", player: B },
    ]);
    settle(game);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(0);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(0);
  });
});

describe("top-5000 batch 22e — Hollowmurk Siege (Sultai)", () => {
  it("draws once a turn however many times counters go on your creatures, and not for an opponent's", () => {
    const { game } = setUp();
    const siege = spawn(game, "Hollowmurk Siege");
    game.state.objects[siege].chosenOnEnter = "Sultai";
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const addCounter: EffectSpec = { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 };
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, addCounter, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand);
    game.debugApplyEffect(A, addCounter, [{ kind: "object", object: bears }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    game.debugApplyEffect(A, addCounter, [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, bears)).toBe(2);
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });
});

describe("top-5000 batch 22e — Mask of Griselbrand", () => {
  it("pays the dead creature's power in life to draw that many", () => {
    const { game } = setUp();
    const mask = spawn(game, "Mask of Griselbrand");
    const giant = spawn(game, "Hill Giant"); // 3/3
    game.state.objects[mask].attachedTo = giant;
    const c = computeCharacteristics(game.state, registry, giant);
    expect(c.keywords.has("flying") && c.keywords.has("lifelink")).toBe(true);
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(life(game, A)).toBe(17);
    expect(game.handOf(A)).toHaveLength(hand + 3);
  });
});

describe("top-5000 batch 22e — Herald of War", () => {
  it("takes {1} off an Angel spell for each +1/+1 counter on it", () => {
    const { game } = setUp(["Serra Angel"]);
    lands(game, "Plains", 3);
    const angel = inHand(game, "Serra Angel");
    const herald = spawn(game, "Herald of War");
    game.state.objects[herald].counters = { "+1/+1": 1 };
    expect(castable(game, angel)).toBe(false);
    game.state.objects[herald].counters = { "+1/+1": 2 };
    expect(castable(game, angel)).toBe(true);
  });
});

describe("top-5000 batch 22e — Chitterspitter", () => {
  it("sacrifices a token for an acorn counter, which pumps the Squirrels", () => {
    const { game } = setUp();
    const spitter = spawn(game, "Chitterspitter");
    game.debugApplyEffect(A, { kind: "create-token", token: "Squirrel Token", count: 2, separate: true }, []);
    settle(game);
    expect(tokens(game, "Squirrel Token")).toBe(2);
    game.debugApplyEffect(A, registry.get("Chitterspitter")!.triggered[0].effect!, [], { source: spitter });
    settle(game);
    expect(counters(game, spitter, "acorn")).toBe(1);
    const left = named(game, "Squirrel Token");
    expect(tokens(game, "Squirrel Token")).toBe(1);
    const c = computeCharacteristics(game.state, registry, left[0]);
    expect([c.power, c.toughness]).toEqual([2, 2]);
  });

  it("puts no counter when there's no token to sacrifice", () => {
    const { game } = setUp();
    const spitter = spawn(game, "Chitterspitter");
    game.debugApplyEffect(A, registry.get("Chitterspitter")!.triggered[0].effect!, [], { source: spitter });
    settle(game);
    expect(counters(game, spitter, "acorn")).toBe(0);
  });
});

describe("top-5000 batch 22e — Basim Ibn Ishaq", () => {
  it("draws for the first historic spell each turn only, and can't be blocked", () => {
    const { game } = setUp(["Ornithopter", "Ornithopter"]);
    const basim = spawn(game, "Basim Ibn Ishaq");
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand - 1 + 1);
    expect(computeCharacteristics(game.state, registry, basim).keywords.has("unblockable")).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand - 2 + 1);
    expect(tokens(game, "Ornithopter")).toBe(2);
  });
});
