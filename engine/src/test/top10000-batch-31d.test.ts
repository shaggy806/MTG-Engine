/**
 * Top-10000 batch 31d. Existing vocabulary only; each test pins the clause
 * most likely to be wired wrong: "that many" ribbon counters and the removal
 * of all of them at three or more (Prize Pig), a discard trigger filtered by
 * three subtypes (Mary Read and Anne Bonny), a loot on any damage to an
 * opponent (Looter il-Kor), X as the mana spent to cast her and double strike
 * for land creatures only (Toph, Greatest Earthbender), the kicked damage
 * (Burst Lightning), the transform paid for in the first main phase and the
 * back face's mana as it transforms (Ashling), the first and second card
 * drawn each turn and the free cast bounded by its counters (Lady Octopus),
 * the color chosen as it resolves (Wash Out), and the "otherwise" read off
 * the turn's deaths (Gravelighter).
 */
import { describe, expect, it } from "vitest";

import type { Action } from "../actions.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { faceName } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

type Cast = Extract<Action, { type: "cast-spell" }>;

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
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
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const graveyard = (game: Game, player: PlayerId = A): readonly ObjectId[] =>
  game.state.zones.perPlayer[player].graveyard;
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;

describe("top-10000 batch 31d — Prize Pig", () => {
  it("puts that many ribbon counters on it, and at three or more removes them all and untaps it", () => {
    const { game } = setUp();
    const pig = game.debugSpawn("Prize Pig", A, "battlefield", { tapped: true, summoningSick: false });
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 });
    game.advanceUntil(quiet);
    expect(counters(game, pig, "ribbon")).toBe(2);
    expect(game.state.objects[pig].tapped).toBe(true);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    game.advanceUntil(quiet);
    // Five counters, every one of them removed (the ruling) — not just three.
    expect(counters(game, pig, "ribbon")).toBe(0);
    expect(game.state.objects[pig].tapped).toBe(false);
  });
});

describe("top-10000 batch 31d — Mary Read and Anne Bonny", () => {
  const treasures = (game: Game): ObjectId[] => named(game, "Treasure Token");

  it("discarding an Island makes a tapped Treasure", () => {
    const { game } = setUp([], "Island");
    spawn(game, "Mary Read and Anne Bonny");
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 });
    game.advanceUntil(quiet);
    expect(treasures(game)).toHaveLength(1);
    expect(game.state.objects[treasures(game)[0]].tapped).toBe(true);
  });

  it("discarding a card that is none of the three makes nothing", () => {
    const { game } = setUp([], "Wastes");
    spawn(game, "Mary Read and Anne Bonny");
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 });
    game.advanceUntil(quiet);
    expect(graveyard(game)).toHaveLength(1);
    expect(treasures(game)).toHaveLength(0);
  });
});

describe("top-10000 batch 31d — Looter il-Kor", () => {
  it("noncombat damage to an opponent loots too", () => {
    const { game } = setUp();
    const looter = spawn(game, "Looter il-Kor");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "damage", amount: 1, target: 0 }, [{ kind: "player", player: B }], {
      source: looter,
    });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    expect(game.handOf(A)).toHaveLength(hand);
    expect(graveyard(game)).toHaveLength(1);
  });
});

describe("top-10000 batch 31d — Toph, Greatest Earthbender", () => {
  it("earthbends X for the mana spent to cast her, and only land creatures get double strike", () => {
    const { game } = setUp(["Toph, Greatest Earthbender"]);
    const mine = [...lands(game, "Mountain", 2), ...lands(game, "Forest", 2)];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Toph, Greatest Earthbender"), targets: [] });
    game.advanceUntil(quiet);
    const toph = named(game, "Toph, Greatest Earthbender")[0];
    const bent = mine.filter((id) => counters(game, id) > 0);
    expect(bent).toHaveLength(1);
    expect(counters(game, bent[0])).toBe(4);
    const land = game.characteristics(bent[0]);
    expect(land.types).toContain("creature");
    expect(land.keywords.has("double-strike")).toBe(true);
    expect(game.characteristics(toph).keywords.has("double-strike")).toBe(false);
  });
});

describe("top-10000 batch 31d — Burst Lightning", () => {
  it("deals 2 unkicked and 4 kicked", () => {
    const { game } = setUp(["Burst Lightning", "Burst Lightning"]);
    lands(game, "Mountain", 6);
    const [first, second] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Burst Lightning");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [{ kind: "player", player: B }] });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(18);
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [{ kind: "player", player: B }], kicked: true });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(14);
  });
});

describe("top-10000 batch 31d — Ashling, Rekindled // Ashling, Rimebound", () => {
  it("pays {U} in the first main phase to transform, and the back face adds two mana of one color as it does", () => {
    const { game, a } = setUp([], "Island");
    const ashling = spawn(game, "Ashling, Rekindled");
    spawn(game, "Island");
    a.chooseModesFn = () => [0];
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(faceName(game.state.objects[ashling])).toBe("Ashling, Rimebound");
    const pool = game.state.players[A].manaPool.map((unit) => unit.type);
    expect(pool).toHaveLength(2);
    expect(pool[0]).toBe(pool[1]);
  });

  it("declining to pay leaves her as she is", () => {
    const { game } = setUp([], "Island");
    const ashling = spawn(game, "Ashling, Rekindled");
    spawn(game, "Island");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(faceName(game.state.objects[ashling])).toBe("Ashling, Rekindled");
  });
});

describe("top-10000 batch 31d — Lady Octopus, Inspired Inventor", () => {
  it("counts the turn's first and second card drawn, not the third", () => {
    const { game } = setUp();
    const lady = spawn(game, "Lady Octopus, Inspired Inventor");
    // The draw step's card was the turn's first, drawn before she arrived.
    expect(game.state.players[A].cardsDrawnThisTurn).toBe(1);
    game.debugApplyEffect(A, { kind: "draw", amount: 2 });
    game.advanceUntil(quiet);
    expect(counters(game, lady, "ingenuity")).toBe(1);
  });

  it("offers only artifact spells with mana value up to her ingenuity counters, cast free", () => {
    const { game, a } = setUp(["Sol Ring", "Mind Stone", "Wurmcoil Engine", "Divination"]);
    const lady = spawn(game, "Lady Octopus, Inspired Inventor");
    game.state.objects[lady].counters = { ...game.state.objects[lady].counters, ingenuity: 2 };
    const stone = inHand(game, "Mind Stone");
    let offered: readonly ObjectId[] = [];
    a.chooseCastNowFn = (_view, offer): Cast => {
      offered = offer.cards;
      return { type: "cast-spell", player: A, card: stone, targets: [], via: "effect", free: true };
    };
    game.dispatch({ type: "activate-ability", player: A, source: lady, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect([...offered].sort()).toEqual([inHand(game, "Sol Ring"), stone].sort());
    expect(game.state.objects[stone].zone).toBe("battlefield");
  });
});

describe("top-10000 batch 31d — Wash Out", () => {
  it("returns only permanents of the color chosen as it resolves", () => {
    const { game, a } = setUp();
    const lions = spawn(game, "Savannah Lions", B);
    const looter = spawn(game, "Merfolk Looter");
    a.chooseModesFn = () => [0]; // White
    game.debugApplyEffect(A, effectOf("Wash Out"));
    game.advanceUntil(quiet);
    expect(game.state.objects[lions].zone).toBe("hand");
    expect(game.state.objects[looter].zone).toBe("battlefield");
  });
});

describe("top-10000 batch 31d — Gravelighter", () => {
  it("with no creature dead this turn, each player sacrifices a creature", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const hand = game.handOf(A).length;
    const gravelighter = game.debugSpawn("Gravelighter", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[gravelighter].zone).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(hand);
  });

  it("once a creature has died this turn, draws a card instead", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    game.advanceUntil(quiet);
    const hand = game.handOf(A).length;
    const gravelighter = game.debugSpawn("Gravelighter", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[gravelighter].zone).toBe("battlefield");
  });
});
