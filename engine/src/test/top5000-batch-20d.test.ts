/**
 * Top-5000 batch 20d. No engine change: each test pins the clause most likely
 * to be wired wrong — Mox Jasper's Dragon gate, Baldur's Gate counting only
 * the *other* Gates, Debt to the Deathless's "two times X", Rampaging
 * Ferocidon's "players can't gain life" and its ping to the entering
 * creature's controller, Bloodline Bidding's chosen type (a changeling
 * included), Saheeli's copy that stays an artifact, Glóin's once-a-turn
 * historic trigger, and Somberwald Sage's creature-only mana.
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
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
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
const canActivate = (game: Game, source: ObjectId, index: number): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === index);
const canCast = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 20d — Mox Jasper", () => {
  it("taps only while you control a Dragon", () => {
    const { game } = setUp();
    const mox = spawn(game, "Mox Jasper");
    expect(canActivate(game, mox, 0)).toBe(false);
    spawn(game, "Shivan Dragon", B);
    expect(canActivate(game, mox, 0)).toBe(false);
    spawn(game, "Shivan Dragon");
    expect(canActivate(game, mox, 0)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: mox, abilityIndex: 0, manaColors: ["R"] });
    expect(pool(game)).toEqual(["R"]);
  });
});

describe("top-5000 batch 20d — Baldur's Gate", () => {
  it("adds one mana of one colour for each other Gate, not itself", () => {
    const { game } = setUp();
    const gate = spawn(game, "Baldur's Gate");
    spawn(game, "Sea Gate");
    spawn(game, "Black Dragon Gate");
    lands(game, "Wastes", 2);
    game.dispatch({ type: "activate-ability", player: A, source: gate, abilityIndex: 1 });
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const made = pool(game);
    expect(made).toHaveLength(2);
    expect(new Set(made).size).toBe(1);
  });
});

describe("top-5000 batch 20d — Debt to the Deathless", () => {
  it("drains each opponent for two times X", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, effectOf("Debt to the Deathless"), [], { x: 3 });
    settle(game);
    expect(life(game, B)).toBe(14);
    expect(life(game, A)).toBe(26);
  });
});

describe("top-5000 batch 20d — Rampaging Ferocidon", () => {
  it("stops every player gaining life, and pings whoever controls an entering creature", () => {
    const { game } = setUp();
    spawn(game, "Rampaging Ferocidon");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    game.debugApplyEffect(B, { kind: "gain-life", amount: 3 });
    settle(game);
    expect(life(game, A)).toBe(20);
    expect(life(game, B)).toBe(20);
    game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(20);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(19);
  });
});

describe("top-5000 batch 20d — Bloodline Bidding", () => {
  it("returns every creature card of the chosen type, a changeling among them, and nothing else", () => {
    const { game, a } = setUp();
    a.chooseCreatureTypeFn = (_view, _source, options) => options.find((t) => t === "Bear") ?? options[0];
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Chomping Changeling", A, "graveyard");
    const elves = game.debugSpawn("Llanowar Elves", A, "graveyard");
    const theirs = game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugApplyEffect(A, effectOf("Bloodline Bidding"));
    settle(game);
    expect(named(game, "Grizzly Bears")).toHaveLength(2);
    expect(named(game, "Chomping Changeling")).toHaveLength(1);
    expect(zone(game, elves)).toBe("graveyard");
    expect(zone(game, theirs)).toBe("graveyard");
  });
});

describe("top-5000 batch 20d — Saheeli, Sublime Artificer", () => {
  it("−2 makes an artifact a copy of a creature that is still an artifact", () => {
    const { game } = setUp();
    const saheeli = spawn(game, "Saheeli, Sublime Artificer");
    const ring = spawn(game, "Sol Ring");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: saheeli,
      abilityIndex: 0,
      targets: [
        { kind: "object", object: ring },
        { kind: "object", object: bears },
      ],
    });
    settle(game);
    const copied = computeCharacteristics(game.state, registry, ring);
    expect(copied.types).toContain("artifact");
    expect(copied.types).toContain("creature");
    expect([copied.power, copied.toughness]).toEqual([2, 2]);
  });

  it("makes a Servo for a noncreature spell", () => {
    const { game } = setUp(["Sol Ring"]);
    spawn(game, "Saheeli, Sublime Artificer");
    lands(game, "Wastes", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring"), targets: [] });
    settle(game);
    expect(named(game, "Servo Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 20d — Glóin, Dwarf Emissary", () => {
  it("makes one Treasure a turn for historic spells", () => {
    const { game } = setUp(["Ornithopter", "Ornithopter"]);
    spawn(game, "Glóin, Dwarf Emissary");
    // Two free artifacts, so no Treasure is spent paying for the second.
    const rings = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Ornithopter");
    expect(rings).toHaveLength(2);
    game.dispatch({ type: "cast-spell", player: A, card: rings[0], targets: [] });
    settle(game);
    expect(named(game, "Treasure Token")).toHaveLength(1);
    game.dispatch({ type: "cast-spell", player: A, card: rings[1], targets: [] });
    settle(game);
    expect(named(game, "Treasure Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 20d — Somberwald Sage", () => {
  it("makes three of one colour that pays for a creature spell and not for anything else", () => {
    const { game } = setUp(["Grizzly Bears", "Sol Ring"]);
    const sage = spawn(game, "Somberwald Sage");
    game.dispatch({ type: "activate-ability", player: A, source: sage, abilityIndex: 0, manaColors: ["G"] });
    expect(pool(game)).toEqual(["G", "G", "G"]);
    expect(canCast(game, inHand(game, "Sol Ring"))).toBe(false);
    expect(canCast(game, inHand(game, "Grizzly Bears"))).toBe(true);
  });
});
