/**
 * Top-10000 batch 30g. No engine change: each test pins the clause of one
 * newly authored card most likely to be wired wrong.
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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const triggerOf = (name: string, index: number): EffectSpec => registry.get(name)!.triggered[index].effect!;
const activatedOf = (name: string, index: number): EffectSpec => registry.get(name)!.activated[index].effect!;

describe("batch 30g — Voldaren Epicure", () => {
  it("pings each opponent and makes a Blood token as it enters", () => {
    const { game } = setUp();
    game.debugSpawn("Voldaren Epicure", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(20);
    expect(named(game, "Blood Token")).toHaveLength(1);
  });
});

describe("batch 30g — Anowon, the Ruin Sage", () => {
  it("has each player sacrifice a non-Vampire creature, sparing Vampires", () => {
    const { game } = setUp();
    const anowon = spawn(game, "Anowon, the Ruin Sage");
    const myBears = spawn(game, "Grizzly Bears");
    const hawk = spawn(game, "Vampire Nighthawk", B);
    const theirBears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, triggerOf("Anowon, the Ruin Sage", 0), [], { source: anowon });
    // An edict's choice is made as a player would next get priority.
    (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
    settle(game);
    expect(zone(game, myBears)).toBe("graveyard");
    expect(zone(game, theirBears)).toBe("graveyard");
    expect(zone(game, anowon)).toBe("battlefield");
    expect(zone(game, hawk)).toBe("battlefield");
  });
});

describe("batch 30g — Kamahl, Heart of Krosa", () => {
  it("animates a land into a 1/1 Elemental with vigilance, indestructible and haste", () => {
    const { game } = setUp();
    const kamahl = spawn(game, "Kamahl, Heart of Krosa");
    const forest = spawn(game, "Forest");
    game.debugApplyEffect(A, activatedOf("Kamahl, Heart of Krosa", 0), [{ kind: "object", object: forest }], {
      source: kamahl,
    });
    settle(game);
    const c = computeCharacteristics(game.state, registry, forest);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("land");
    expect(c.subtypes).toContain("Elemental");
    expect(c.subtypes).toContain("Forest");
    expect([c.power, c.toughness]).toEqual([1, 1]);
    for (const k of ["vigilance", "indestructible", "haste"] as const) expect(c.keywords.has(k)).toBe(true);
  });

  it("gives your creatures +3/+3 and trample at the beginning of combat, not an opponent's", () => {
    const { game } = setUp();
    const kamahl = spawn(game, "Kamahl, Heart of Krosa");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, triggerOf("Kamahl, Heart of Krosa", 0), [], { source: kamahl });
    settle(game);
    expect(pt(game, bears)).toEqual([5, 5]);
    expect(pt(game, kamahl)).toEqual([8, 8]);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("trample")).toBe(true);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });
});

describe("batch 30g — Scrollshift", () => {
  it("draws a card with no target chosen", () => {
    const { game } = setUp();
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Scrollshift"), []);
    settle(game);
    expect(game.handOf(A)).toHaveLength(before + 1);
  });

  it("blinks its target (a new object, counters gone) and draws", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 2 };
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Scrollshift"), [{ kind: "object", object: bears }]);
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(counters(game, back[0])).toBe(0);
    expect(game.handOf(A)).toHaveLength(before + 1);
  });
});

describe("batch 30g — Diamond Weapon", () => {
  it("costs {1} less for each permanent card in your graveyard, not instants", () => {
    const { game } = setUp(["Diamond Weapon"], "Forest");
    lands(game, "Forest", 5);
    const weapon = inHand(game, "Diamond Weapon");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === weapon);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Lightning Bolt", A, "graveyard");
    expect(castable()).toBe(false);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Grizzly Bears", A, "graveyard");
    expect(castable()).toBe(true);
  });
});

describe("batch 30g — Ashcoat of the Shadow Swarm", () => {
  it("gives other Rats +X/+X where X counts every Rat, itself included", () => {
    const { game } = setUp();
    const ashcoat = spawn(game, "Ashcoat of the Shadow Swarm");
    const rats = [spawn(game, "Rat Token"), spawn(game, "Rat Token")];
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, triggerOf("Ashcoat of the Shadow Swarm", 0), [], { source: ashcoat });
    settle(game);
    for (const rat of rats) expect(pt(game, rat)).toEqual([4, 4]);
    expect(pt(game, ashcoat)).toEqual([3, 4]);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("batch 30g — Belladonna Took", () => {
  it("gains 1, then draws, then counters, then nothing, as tokens enter one by one", () => {
    const { game } = setUp();
    const belladonna = spawn(game, "Belladonna Took");
    const token = (): void => {
      game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 });
      settle(game);
    };
    const hand = game.handOf(A).length;
    token();
    expect(life(game, A)).toBe(21);
    expect(game.handOf(A)).toHaveLength(hand);
    token();
    expect(life(game, A)).toBe(21);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    token();
    expect(counters(game, belladonna)).toBe(1);
    for (const id of named(game, "Soldier Token")) expect(counters(game, id)).toBe(1);
    token();
    expect(life(game, A)).toBe(21);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    expect(counters(game, belladonna)).toBe(1);
  });
});

describe("batch 30g — Toothy, Imaginary Friend", () => {
  it("draws a card for each +1/+1 counter it had as it leaves", () => {
    const { game } = setUp();
    const toothy = spawn(game, "Toothy, Imaginary Friend");
    game.state.objects[toothy].counters = { "+1/+1": 3 };
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [{ kind: "object", object: toothy }]);
    settle(game);
    // Toothy itself, plus three draws.
    expect(game.handOf(A)).toHaveLength(hand + 4);
  });
});

describe("batch 30g — Expand the Sphere", () => {
  it("proliferates twice when no land is found", () => {
    const { game } = setUp([], "Grizzly Bears");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, effectOf("Expand the Sphere"), []);
    settle(game);
    expect(counters(game, bears)).toBe(3);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
  });

  it("proliferates once when one land goes onto the battlefield tapped", () => {
    const { game } = setUp([], "Grizzly Bears");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    game.debugSpawn("Forest", A, "library");
    game.debugApplyEffect(A, effectOf("Expand the Sphere"), []);
    settle(game);
    const forest = named(game, "Forest");
    expect(forest).toHaveLength(1);
    expect(game.state.objects[forest[0]].tapped).toBe(true);
    expect(counters(game, bears)).toBe(2);
  });
});
