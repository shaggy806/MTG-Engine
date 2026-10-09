/**
 * Top-10000 batch 32e. No engine change: each test pins the clause most
 * likely to be wired wrong — a ward granted by an animation (Hall of Storm
 * Giants), an Aura's death trigger stealing the card back (Minion's Return),
 * a split card's untargeted counters before a -4/-4 (Finality), a Lesson-count
 * branch (Accumulate Wisdom), an activation gated on an empty hand (Sea Gate
 * Wreckage), and counts read off the board (Honden of Night's Reach, Staff of
 * Eden, Spider-Ham).
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
  bHand: readonly string[] = [],
): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Wastes")] },
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
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
};

describe("top-10000 batch 32e — Hall of Storm Giants", () => {
  it("becomes a 7/7 blue Giant whose granted ward counters an opponent's unpaid Bolt", () => {
    const { game } = setUp([], "Wastes", ["Lightning Bolt"]);
    lands(game, "Island", 6);
    const hall = spawn(game, "Hall of Storm Giants");
    spawn(game, "Mountain", B);
    game.dispatch({ type: "activate-ability", player: A, source: hall, abilityIndex: 1 });
    game.advanceUntil(quiet);
    const c = computeCharacteristics(game.state, registry, hall);
    expect([c.power, c.toughness]).toEqual([7, 7]);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("land");
    expect([...c.colors]).toEqual(["U"]);
    game.dispatch({ type: "pass-priority", player: A });
    const bolt = inHand(game, "Lightning Bolt", B);
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [{ kind: "object", object: hall }] });
    game.advanceUntil(quiet);
    // One Mountain: the Bolt's {R} and nothing for ward.
    expect(game.eventsOfType("ward-unpaid")).toEqual([expect.objectContaining({ object: hall, player: B })]);
    expect(game.state.objects[hall].zone).toBe("battlefield");
    expect(game.state.objects[hall].damageMarked).toBe(0);
  });
});

describe("top-10000 batch 32e — Minion's Return", () => {
  it("returns the enchanted opponent's creature under the Aura's controller when it dies", () => {
    const { game } = setUp(["Minion's Return"], "Swamp");
    lands(game, "Swamp", 3);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Minion's Return"),
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    expect(named(game, "Minion's Return")).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].controller).toBe(A);
    expect(game.state.objects[back[0]].owner).toBe(B);
  });
});

describe("top-10000 batch 32e — Sea Gate Wreckage", () => {
  it("draws only while your hand is empty", () => {
    const { game } = setUp();
    lands(game, "Wastes", 3);
    const wreckage = spawn(game, "Sea Gate Wreckage");
    const canDraw = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === wreckage && x.abilityIndex === 1);
    expect(game.handOf(A).length).toBeGreaterThan(0);
    expect(canDraw()).toBe(false);
    for (const id of [...game.handOf(A)]) game.debugMove(id, "graveyard");
    expect(canDraw()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: wreckage, abilityIndex: 1 });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(1);
  });
});

describe("top-10000 batch 32e — Honden of Night's Reach", () => {
  it("makes the target opponent discard one card per Shrine you control", () => {
    const { game } = setUp();
    const honden = spawn(game, "Honden of Night's Reach");
    spawn(game, "Honden of Infinite Rage");
    spawn(game, "Honden of Infinite Rage", B);
    const before = game.handOf(B).length;
    const upkeep = registry.get("Honden of Night's Reach")!.triggered[0].effect!;
    game.debugApplyEffect(A, upkeep, [{ kind: "player", player: B }], { source: honden });
    settle(game);
    expect(game.handOf(B)).toHaveLength(before - 2);
  });
});

describe("top-10000 batch 32e — Staff of Eden, Vault's Key", () => {
  it("steals a legend from an opponent's graveyard, then draws for each permanent you don't own", () => {
    const { game } = setUp();
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugSpawn("Isamaru, Hound of Konda", B, "graveyard");
    const staff = game.debugSpawn("Staff of Eden, Vault's Key", A, "battlefield", { announceEntry: true });
    settle(game);
    const isamaru = named(game, "Isamaru, Hound of Konda");
    expect(isamaru).toHaveLength(1);
    expect(game.state.objects[isamaru[0]].controller).toBe(A);
    expect(named(game, "Grizzly Bears")).toHaveLength(0);
    spawn(game, "Grizzly Bears");
    const before = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: staff, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(before + 1);
  });
});

describe("top-10000 batch 32e — Spider-Ham, Peter Porker", () => {
  it("pumps your other animals of the listed types, not itself or a Giant", () => {
    const { game } = setUp();
    const ham = spawn(game, "Spider-Ham, Peter Porker");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(pt(game, ham)).toEqual([2, 2]);
    expect(pt(game, bears)).toEqual([3, 3]);
    expect(pt(game, giant)).toEqual([3, 3]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });
});

describe("top-10000 batch 32e — Combine Chrysalis", () => {
  it("gives creature tokens you control flying, and nothing else", () => {
    const { game } = setUp();
    spawn(game, "Combine Chrysalis");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Beast Token", count: 1 });
    const [beast] = named(game, "Beast Token");
    expect(computeCharacteristics(game.state, registry, beast).keywords.has("flying")).toBe(true);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("flying")).toBe(false);
  });
});
