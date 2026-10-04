/**
 * Top-5000 batch 21h. No engine change: each test pins the clause of one card
 * most likely to be wired wrong — The Goose Mother's "half X, rounded up",
 * Jolrael's base P/T fixed at the hand size, Oakhollow Village's "entered the
 * battlefield this turn" over four subtypes, Shoreline Looter's discard
 * "unless" threshold, the cost reductions of Eye of Ugin and Mindsplice
 * Apparatus, and Tyvar's X read once.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
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
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** Every token in a stack counts. */
const howMany = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 21h — The Goose Mother", () => {
  it("enters with X counters and makes half X Food, rounded up", () => {
    const { game } = setUp(["The Goose Mother"]);
    lands(game, "Forest", 4);
    lands(game, "Island", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "The Goose Mother"), targets: [], xValue: 3 });
    settle(game);
    const goose = named(game, "The Goose Mother");
    expect(goose).toHaveLength(1);
    expect(counters(game, goose[0])).toBe(3);
    expect(howMany(game, "Food Token")).toBe(2);
  });
});

describe("top-5000 batch 21h — Jolrael, Mwonvuli Recluse", () => {
  it("sets your creatures' base P/T to the cards in your hand as it resolves", () => {
    const { game } = setUp();
    const jolrael = spawn(game, "Jolrael, Mwonvuli Recluse");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].counters = { "+1/+1": 1 };
    lands(game, "Forest", 6);
    const hand = game.handOf(A).length;
    expect(hand).toBeGreaterThan(2);
    game.dispatch({ type: "activate-ability", player: A, source: jolrael, abilityIndex: 0 });
    settle(game);
    expect(pt(game, jolrael)).toEqual([hand, hand]);
    // Counters still apply on top of the new base (the ruling).
    expect(pt(game, bears)).toEqual([hand + 1, hand + 1]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });
});

describe("top-5000 batch 21h — Oakhollow Village", () => {
  it("counters only the listed types you control that entered this turn", () => {
    const { game } = setUp();
    const village = spawn(game, "Oakhollow Village");
    spawn(game, "Forest");
    const fresh = spawn(game, "Squirrel Token");
    const old = spawn(game, "Rabbit Token");
    game.state.objects[old].enteredBattlefieldOnTurn = 0;
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Squirrel Token", B);
    game.dispatch({ type: "activate-ability", player: A, source: village, abilityIndex: 2 });
    settle(game);
    expect(counters(game, fresh)).toBe(1);
    expect(counters(game, old)).toBe(0);
    expect(counters(game, bears)).toBe(0);
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("top-5000 batch 21h — Shoreline Looter", () => {
  const loot = registry.get("Shoreline Looter")!.triggered[0].effect!;

  it("draws, then discards without threshold", () => {
    const { game } = setUp();
    const looter = spawn(game, "Shoreline Looter");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, loot, [], { source: looter });
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand);
  });

  it("only draws with seven or more cards in the graveyard", () => {
    const { game } = setUp();
    const looter = spawn(game, "Shoreline Looter");
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Wastes", A, "graveyard");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, loot, [], { source: looter });
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });
});

describe("top-5000 batch 21h — Eye of Ugin", () => {
  it("takes {2} off a colorless Eldrazi spell", () => {
    const { game } = setUp(["Eldrazi Devastator"]);
    lands(game, "Wastes", 6);
    const devastator = inHand(game, "Eldrazi Devastator");
    expect(castable(game, devastator)).toBe(false);
    spawn(game, "Eye of Ugin");
    expect(castable(game, devastator)).toBe(true);
  });
});

describe("top-5000 batch 21h — Mindsplice Apparatus", () => {
  it("takes {1} off instants and sorceries per oil counter", () => {
    const { game } = setUp(["Divination"]);
    lands(game, "Island", 1);
    const divination = inHand(game, "Divination");
    const apparatus = spawn(game, "Mindsplice Apparatus");
    expect(castable(game, divination)).toBe(false);
    game.state.objects[apparatus].counters = { oil: 1 };
    expect(castable(game, divination)).toBe(false);
    game.state.objects[apparatus].counters = { oil: 2 };
    expect(castable(game, divination)).toBe(true);
  });
});

describe("top-5000 batch 21h — Tyvar, the Pummeler", () => {
  it("pumps by the greatest power, read once as it resolves", () => {
    const { game } = setUp();
    const tyvar = spawn(game, "Tyvar, the Pummeler");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 3 };
    const theirs = spawn(game, "Hill Giant", B);
    lands(game, "Forest", 5);
    game.dispatch({ type: "activate-ability", player: A, source: tyvar, abilityIndex: 1 });
    settle(game);
    expect(pt(game, bears)).toEqual([10, 10]);
    expect(pt(game, tyvar)).toEqual([8, 8]);
    expect(pt(game, theirs)).toEqual([3, 3]);
  });

  it("taps another creature to gain indestructible, then taps itself", () => {
    const { game } = setUp();
    const tyvar = spawn(game, "Tyvar, the Pummeler");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: tyvar, abilityIndex: 0, tap: [bears] });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(game.state.objects[tyvar].tapped).toBe(true);
    expect(computeCharacteristics(game.state, registry, tyvar).keywords.has("indestructible")).toBe(true);
  });
});
