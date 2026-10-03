/**
 * Cards missing from eight or more official Commander precons, batch 1:
 * Rupture Spire, Vivid Grove / Vivid Creek, Yavimaya Elder, Armillary Sphere
 * and Return to Dust.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const setUp = (library: readonly string[] = Array<string>(60).fill("Island")) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: [
      { player: A, cards: [...library] },
      { player: B, cards: Array<string>(60).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, A, "battlefield", { summoningSick: false });
};

const settle = (game: Game): void => {
  game.advanceUntil((s) => (s.zones.shared.stack.length === 0 && s.awaiting === null) || s.awaiting !== null);
};

const answerModes = (game: Game, modes: number[]): void => {
  expect(game.state.awaiting?.kind).toBe("choose-modes");
  game.dispatch({ type: "choose-modes", player: A, modes });
  settle(game);
};

const onBattlefield = (game: Game, id: ObjectId): boolean => game.state.objects[id]?.zone === "battlefield";

describe("Rupture Spire", () => {
  const play = (game: Game): ObjectId => {
    const spire = game.debugSpawn("Rupture Spire", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: spire });
    settle(game);
    return spire;
  };

  it("enters tapped and stays if you pay {1}", () => {
    const game = setUp();
    lands(game, "Wastes", 1);
    const spire = play(game);
    expect(game.state.objects[spire].tapped).toBe(true);
    answerModes(game, [0]);
    expect(onBattlefield(game, spire)).toBe(true);
  });

  it("is sacrificed if you don't pay", () => {
    const game = setUp();
    lands(game, "Wastes", 1);
    const spire = play(game);
    answerModes(game, []);
    expect(onBattlefield(game, spire)).toBe(false);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(1);
  });
});

describe("Vivid Grove", () => {
  it("enters tapped with two charge counters, and each any-color tap spends one", () => {
    const game = setUp();
    const grove = game.debugSpawn("Vivid Grove", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: grove });
    settle(game);
    const object = game.state.objects[grove];
    expect(object.tapped).toBe(true);
    expect(object.counters.charge).toBe(2);

    object.tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: grove, abilityIndex: 1, targets: [], manaColors: ["R"] });
    expect(game.state.objects[grove].counters.charge).toBe(1);
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["R"]);
  });

  it("can't make any color with no charge counters left, but still taps for {G}", () => {
    const game = setUp();
    const grove = game.debugSpawn("Vivid Grove", A, "battlefield", { summoningSick: false });
    game.state.objects[grove].counters.charge = 0;
    game.state.objects[grove].tapped = false;
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: grove, abilityIndex: 1, targets: [], manaColors: ["R"] }),
    ).toThrow();
    game.dispatch({ type: "activate-ability", player: A, source: grove, abilityIndex: 0, targets: [] });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G"]);
  });
});

describe("Yavimaya Elder", () => {
  const library = [...Array<string>(10).fill("Grizzly Bears"), "Forest", "Plains", "Island", ...Array<string>(47).fill("Grizzly Bears")];

  it("sacrificed to itself, it searches for two basics before the draw", () => {
    const game = setUp(library);
    lands(game, "Wastes", 2);
    const elder = game.debugSpawn("Yavimaya Elder", A, "battlefield", { summoningSick: false });
    const handBefore = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "activate-ability", player: A, source: elder, abilityIndex: 0, targets: [] });
    settle(game);
    // The dies trigger resolves first: the "may".
    answerModes(game, [0]);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    const lib = game.state.zones.perPlayer[A].library;
    const basics = lib.filter((id) => ["Forest", "Plains", "Island"].includes(game.state.objects[id].cardName));
    expect(basics).toHaveLength(3);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: basics.slice(0, 2) });
    settle(game);
    const hand = game.state.zones.perPlayer[A].hand;
    // Two lands found, then the draw.
    expect(hand.length).toBe(handBefore + 3);
    for (const id of basics.slice(0, 2)) expect(hand).toContain(id);
  });

  it("declining the search finds nothing and still draws", () => {
    const game = setUp(library);
    lands(game, "Wastes", 2);
    const elder = game.debugSpawn("Yavimaya Elder", A, "battlefield", { summoningSick: false });
    const handBefore = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "activate-ability", player: A, source: elder, abilityIndex: 0, targets: [] });
    settle(game);
    answerModes(game, []);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore + 1);
  });
});

describe("Return to Dust", () => {
  const cast = (game: Game, first: ObjectId, second: ObjectId): void => {
    lands(game, "Plains", 4);
    const card = game.debugSpawn("Return to Dust", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(first), obj(second)] });
    settle(game);
  };

  it("cast in your main phase, exiles both targets", () => {
    const game = setUp();
    const a = game.debugSpawn("Sol Ring", B, "battlefield");
    const b = game.debugSpawn("Mind Stone", B, "battlefield");
    cast(game, a, b);
    answerModes(game, [0]);
    expect(game.state.objects[a].zone).toBe("exile");
    expect(game.state.objects[b].zone).toBe("exile");
  });

  it("in your main phase you may still keep the second", () => {
    const game = setUp();
    const a = game.debugSpawn("Sol Ring", B, "battlefield");
    const b = game.debugSpawn("Mind Stone", B, "battlefield");
    cast(game, a, b);
    answerModes(game, []);
    expect(game.state.objects[a].zone).toBe("exile");
    expect(onBattlefield(game, b)).toBe(true);
  });

  it("cast during combat, exiles only the first", () => {
    const game = setUp();
    const a = game.debugSpawn("Sol Ring", B, "battlefield");
    const b = game.debugSpawn("Mind Stone", B, "battlefield");
    game.advanceUntil((s) => s.turn.step === "begin-combat" && s.priority.holder === A);
    cast(game, a, b);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[a].zone).toBe("exile");
    expect(onBattlefield(game, b)).toBe(true);
  });

  it("cast in an opponent's main phase, exiles only the first", () => {
    const game = setUp();
    const a = game.debugSpawn("Sol Ring", B, "battlefield");
    const b = game.debugSpawn("Mind Stone", B, "battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === A);
    cast(game, a, b);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[a].zone).toBe("exile");
    expect(onBattlefield(game, b)).toBe(true);
  });

  it("can't target the same permanent twice", () => {
    const game = setUp();
    const a = game.debugSpawn("Sol Ring", B, "battlefield");
    lands(game, "Plains", 4);
    const card = game.debugSpawn("Return to Dust", A, "hand");
    expect(() => game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(a), obj(a)] })).toThrow();
  });
});
