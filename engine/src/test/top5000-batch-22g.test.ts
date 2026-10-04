/**
 * Top-5000 batch 22g. No engine change: every card here is existing
 * vocabulary. The tests pin the clause most likely to be wired wrong on each.
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
const toPostCombat = (game: Game): void =>
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;

describe("top-5000 batch 22g — Honored Dreyleader", () => {
  it("counts each other Squirrel and Food as it enters, then grows as another enters", () => {
    const { game } = setUp();
    spawn(game, "Squirrel Token");
    spawn(game, "Food Token");
    const drey = game.debugSpawn("Honored Dreyleader", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, drey)).toBe(2);
    game.debugSpawn("Food Token", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, drey)).toBe(3);
    // Not a Squirrel or Food: nothing.
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, drey)).toBe(3);
  });
});

describe("top-5000 batch 22g — Pick Your Poison", () => {
  it("the flying mode takes a creature with flying, not one without", () => {
    const { game } = setUp(["Pick Your Poison"], "Forest");
    lands(game, "Forest", 1);
    const angel = spawn(game, "Serra Angel", B);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Pick Your Poison"), modes: [2], targets: [] });
    settle(game);
    expect(zone(game, angel)).toBe("graveyard");
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("top-5000 batch 22g — Goro-Goro, Disciple of Ryusei", () => {
  it("makes a Dragon Spirit only while you control an attacking modified creature", () => {
    const { game, a } = setUp();
    const goro = spawn(game, "Goro-Goro, Disciple of Ryusei");
    game.state.objects[goro].counters = { "+1/+1": 1 };
    lands(game, "Mountain", 5);
    const canMake = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === goro && x.abilityIndex === 1);
    // Modified, but not attacking.
    expect(canMake()).toBe(false);
    a.declareAttackersFn = () => [{ attacker: goro, defender: B }];
    game.advanceUntil((s) => s.objects[goro].attacking !== null && s.turn.step === "declare-attackers" && quiet(s));
    expect(canMake()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: goro, abilityIndex: 1, targets: [] });
    settle(game);
    expect(named(game, "Dragon Spirit Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 22g — Oppression", () => {
  it("makes the player who cast the spell discard, the caster included", () => {
    const { game } = setUp(["Grizzly Bears", "Lightning Bolt"], "Forest");
    spawn(game, "Oppression");
    lands(game, "Forest", 2);
    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    // One card cast, one discarded.
    expect(game.handOf(A)).toHaveLength(before - 2);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(1);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(0);
  });
});

describe("top-5000 batch 22g — Flayer of Loyalties", () => {
  it("steals and untaps the creature as a 10/10 with trample, haste and annihilator 2", () => {
    const { game, a } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true, summoningSick: false });
    lands(game, "Wastes", 3, B);
    const cast = registry.get("Flayer of Loyalties")!.triggered[0].effect!;
    game.debugApplyEffect(A, cast, [{ kind: "object", object: bears }]);
    settle(game);
    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[bears].tapped).toBe(false);
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([10, 10]);
    expect(c.keywords.has("trample") && c.keywords.has("haste")).toBe(true);
    // Annihilator 2: bob sacrifices two of his three lands as it attacks.
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.objects[bears].attacking !== null && s.turn.step === "declare-attackers" && quiet(s));
    settle(game);
    expect(game.battlefield.filter((id) => game.state.objects[id].controller === B)).toHaveLength(1);
  });
});

describe("top-5000 batch 22g — Impostor Syndrome", () => {
  it("copies a legendary creature that connects as a nonlegendary token, so both stay", () => {
    const { game, a } = setUp();
    spawn(game, "Impostor Syndrome");
    const isamaru = spawn(game, "Isamaru, Hound of Konda");
    a.declareAttackersFn = () => [{ attacker: isamaru, defender: B }];
    toPostCombat(game);
    const all = named(game, "Isamaru, Hound of Konda");
    expect(all).toHaveLength(2);
    const token = all.find((id) => id !== isamaru)!;
    expect(game.state.objects[token].isToken).toBe(true);
    expect(game.state.objects[token].controller).toBe(A);
  });
});

describe("top-5000 batch 22g — Zimone, Paradox Sculptor", () => {
  it("doubles each kind of counter on a creature and an artifact", () => {
    const { game } = setUp();
    const zimone = spawn(game, "Zimone, Paradox Sculptor");
    spawn(game, "Forest");
    spawn(game, "Island");
    const bears = spawn(game, "Grizzly Bears");
    const ring = spawn(game, "Sol Ring");
    game.state.objects[bears].counters = { "+1/+1": 2 };
    game.state.objects[ring].counters = { charge: 1 };
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: zimone,
      abilityIndex: 0,
      targets: [
        { kind: "object", object: bears },
        { kind: "object", object: ring },
      ],
    });
    settle(game);
    expect(counters(game, bears)).toBe(4);
    expect(counters(game, ring, "charge")).toBe(2);
  });
});

describe("top-5000 batch 22g — Spell Swindle", () => {
  it("counters the spell and makes Treasures equal to its mana value", () => {
    const { game } = setUp(["Hill Giant"], "Mountain");
    lands(game, "Mountain", 4);
    const giant = inHand(game, "Hill Giant");
    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [] });
    expect(zone(game, giant)).toBe("stack");
    game.debugApplyEffect(A, effectOf("Spell Swindle"), [{ kind: "object", object: giant }]);
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    // A token stack counts as every token in it.
    const treasures = named(game, "Treasure Token").reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(treasures).toBe(4);
  });
});

describe("top-5000 batch 22g — Keeper of Fables", () => {
  it("draws once when two non-Humans connect together", () => {
    const { game, a } = setUp();
    spawn(game, "Keeper of Fables");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    const before = game.handOf(A).length;
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: elves, defender: B },
    ];
    toPostCombat(game);
    expect(game.handOf(A)).toHaveLength(before + 1);
  });
});
