/**
 * Top-5000 batch 21b. No engine change: each test pins the clause of a card
 * most likely to be wired wrong — a draw-count trigger, a once-a-turn counters
 * trigger, a one-sided bite with poison, two combat-damage prevention shields,
 * statics scoped by type and by commander, a cost reduction, a landfall CDA,
 * a "that player" exile off an opponent's land, and a first-spell copy.
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
const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
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
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
const hasKeyword = (game: Game, id: ObjectId, keyword: string): boolean =>
  computeCharacteristics(game.state, registry, id).keywords.has(keyword as never);
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

describe("top-5000 batch 21b — Mischievous Mystic", () => {
  it("makes one Faerie for the second card drawn this turn, and no more", () => {
    const { game } = setUp();
    spawn(game, "Mischievous Mystic");
    // Alice drew for her turn already, so one of these two is her second card
    // whichever way the draw step went.
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    settle(game);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    settle(game);
    expect(named(game, "Faerie Token")).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "draw", amount: 2 });
    settle(game);
    expect(named(game, "Faerie Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 21b — Dusk Legion Duelist", () => {
  it("draws once a turn however many times counters are put on it", () => {
    const { game } = setUp();
    const duelist = spawn(game, "Dusk Legion Duelist");
    const before = game.handOf(A).length;
    const counter = { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 } as const;
    game.debugApplyEffect(A, counter, [{ kind: "object", object: duelist }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(before + 1);
    game.debugApplyEffect(A, counter, [{ kind: "object", object: duelist }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(before + 1);
    expect(game.state.objects[duelist].counters["+1/+1"]).toBe(2);
  });
});

describe("top-5000 batch 21b — Infectious Bite", () => {
  it("bites one way, then gives each opponent a poison counter", () => {
    const { game } = setUp(["Infectious Bite"], "Forest");
    lands(game, "Forest", 2);
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Infectious Bite"),
      targets: [
        { kind: "object", object: giant },
        { kind: "object", object: bears },
      ],
    });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.objects[giant].damageMarked).toBe(0);
    expect(game.state.players[B].counters.poison).toBe(1);
    expect(game.state.players[A].counters.poison).toBeUndefined();
  });
});

describe("top-5000 batch 21b — Fog Bank", () => {
  it("prevents the combat damage dealt to it and by it", () => {
    const { game, a, b } = setUp();
    const giant = spawn(game, "Hill Giant");
    const fog = spawn(game, "Fog Bank", B);
    // A 2/4 Fog Bank: its own damage would be dealt but for the prevention.
    game.state.objects[fog].counters = { "+1/+1": 2 };
    a.declareAttackersFn = () => [{ attacker: giant, defender: B }];
    b.declareBlockersFn = () => [{ blocker: fog, attacker: giant }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(zone(game, fog)).toBe("battlefield");
    expect(game.state.objects[fog].damageMarked).toBe(0);
    expect(game.state.objects[giant].damageMarked).toBe(0);
    expect(life(game, B)).toBe(20);
  });
});

describe("top-5000 batch 21b — Cryptothrall", () => {
  it("gives hexproof to your other artifact creatures only", () => {
    const { game } = setUp();
    const thrall = spawn(game, "Cryptothrall");
    const thopter = spawn(game, "Ornithopter");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Ornithopter", B);
    expect(hasKeyword(game, thopter, "hexproof")).toBe(true);
    expect(hasKeyword(game, thrall, "hexproof")).toBe(false);
    expect(hasKeyword(game, bears, "hexproof")).toBe(false);
    expect(hasKeyword(game, theirs, "hexproof")).toBe(false);
  });
});

describe("top-5000 batch 21b — Heartless Summoning", () => {
  it("takes {2} off your creature spells and shrinks your creatures", () => {
    const { game } = setUp(["Grizzly Bears"]);
    lands(game, "Forest", 1);
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Hill Giant", B);
    const card = inHand(game, "Grizzly Bears");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);
    expect(castable()).toBe(false);
    spawn(game, "Heartless Summoning");
    expect(castable()).toBe(true);
    expect(pt(game, giant)).toEqual([2, 2]);
    expect(pt(game, theirs)).toEqual([3, 3]);
  });
});

describe("top-5000 batch 21b — Guardian Augmenter", () => {
  it("pumps and protects a commander you control, not another creature", () => {
    const { game } = setUp();
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const giant = spawn(game, "Hill Giant");
    spawn(game, "Guardian Augmenter");
    expect(pt(game, commander)).toEqual([4, 4]);
    expect(hasKeyword(game, commander, "hexproof")).toBe(true);
    expect(pt(game, giant)).toEqual([3, 3]);
    expect(hasKeyword(game, giant, "hexproof")).toBe(false);
  });
});

describe("top-5000 batch 21b — Greensleeves, Maro-Sorcerer", () => {
  it("counts your lands for its size, and makes a Badger on landfall", () => {
    const { game } = setUp();
    lands(game, "Forest", 3);
    lands(game, "Forest", 2, B);
    const sleeves = spawn(game, "Greensleeves, Maro-Sorcerer");
    expect(pt(game, sleeves)).toEqual([3, 3]);
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(pt(game, sleeves)).toEqual([4, 4]);
    const badgers = named(game, "Badger Token");
    expect(badgers).toHaveLength(1);
    expect(pt(game, badgers[0])).toEqual([3, 3]);
  });
});

describe("top-5000 batch 21b — Sire of Stagnation", () => {
  it("has the land's controller exile two from their library while you draw two", () => {
    const { game } = setUp();
    spawn(game, "Sire of Stagnation");
    const handBefore = game.handOf(A).length;
    const libraryBefore = game.state.zones.perPlayer[B].library.length;
    game.debugSpawn("Forest", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.zones.perPlayer[B].library).toHaveLength(libraryBefore - 2);
    expect(game.handOf(A)).toHaveLength(handBefore + 2);
    // A land of your own does nothing.
    const ownLibrary = game.state.zones.perPlayer[A].library.length;
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.zones.perPlayer[A].library).toHaveLength(ownLibrary);
    expect(game.handOf(A)).toHaveLength(handBefore + 2);
  });
});

describe("top-5000 batch 21b — Double Vision", () => {
  it("copies only the first instant or sorcery spell you cast each turn", () => {
    const { game } = setUp(["Divination", "Divination"], "Island");
    lands(game, "Island", 6);
    spawn(game, "Double Vision");
    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Divination"), targets: [] });
    settle(game);
    // One card cast, two drawn by the copy and two by the original.
    expect(game.handOf(A)).toHaveLength(before - 1 + 4);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Divination"), targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(before - 2 + 6);
  });
});
