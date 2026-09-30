/**
 * Top-5000 batch 18 (ranks 2245–2346). One engine change: a flicker can
 * return a permanent **with** counters (`FlickerCounters.entering`), on it as
 * it enters (Planar Incision) rather than put on afterwards (Essence Flux).
 * The rest pin the clauses most likely to be wired wrong — "your commander"
 * as the one you own (Tome of Legends), a split of counters among up to two
 * targets before a doubling (Court of Garenbrig), "one or more … die" held
 * to once a turn (Spiteful Banditry), a granted trigger seeing its own
 * holder die (Agent of the Iron Throne), and the mana abilities.
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

describe("top-5000 batch 18 — Planar Incision", () => {
  it("returns the permanent with its counter already on, so evolve sees it", () => {
    const { game } = setUp();
    const oak = spawn(game, "Scurry Oak");
    const elves = spawn(game, "Llanowar Elves");
    game.debugApplyEffect(A, effectOf("Planar Incision"), [{ kind: "object", object: elves }]);
    settle(game);
    const back = named(game, "Llanowar Elves");
    expect(back).toHaveLength(1);
    expect(counters(game, back[0])).toBe(1);
    // A 2/2 entering beats the 1/2 Oak: it evolves, and its counter makes a
    // Squirrel.
    expect(counters(game, oak)).toBe(1);
    expect(named(game, "Squirrel Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 18 — Court of Garenbrig", () => {
  it("puts both counters on a lone target, then the monarch doubles every creature of theirs", () => {
    const { game } = setUp();
    const court = game.debugSpawn("Court of Garenbrig", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.monarch).toBe(A);
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    for (const id of [bears, giant, theirs]) game.state.objects[id].counters = { "+1/+1": 1 };
    const upkeep = registry.get("Court of Garenbrig")!.triggered[1].effect!;
    game.debugApplyEffect(A, upkeep, [{ kind: "object", object: bears }], { source: court });
    settle(game);
    expect(counters(game, bears)).toBe(6);
    expect(counters(game, giant)).toBe(2);
    expect(counters(game, theirs)).toBe(1);
  });
});

describe("top-5000 batch 18 — Tome of Legends", () => {
  it("turns a page for a commander you own, whoever controls it, and not for another's", () => {
    const { game } = setUp();
    const tome = game.debugSpawn("Tome of Legends", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, tome, "page")).toBe(1);
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.state.objects[mine].isCommander = true;
    game.debugApplyEffect(B, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [
      { kind: "object", object: mine },
    ]);
    settle(game);
    expect(game.state.objects[mine].controller).toBe(B);
    expect(counters(game, tome, "page")).toBe(2);
    const theirs = game.debugSpawn("Hill Giant", B, "graveyard");
    game.state.objects[theirs].isCommander = true;
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [
      { kind: "object", object: theirs },
    ]);
    settle(game);
    expect(game.state.objects[theirs].controller).toBe(A);
    expect(counters(game, tome, "page")).toBe(2);
  });
});

describe("top-5000 batch 18 — Spiteful Banditry", () => {
  it("deals X to each creature, and makes one Treasure a turn however many die", () => {
    const { game } = setUp(["Spiteful Banditry"], "Mountain");
    lands(game, "Mountain", 4);
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", B);
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Spiteful Banditry"), targets: [], xValue: 2 });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, elves)).toBe("graveyard");
    expect(zone(game, giant)).toBe("battlefield");
    expect(named(game, "Treasure Token")).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    settle(game);
    expect(named(game, "Treasure Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 18 — Agent of the Iron Throne", () => {
  it("gives your commander a trigger that sees artifacts and the commander itself go", () => {
    const { game } = setUp();
    spawn(game, "Agent of the Iron Throne");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const ring = spawn(game, "Sol Ring");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: ring }]);
    settle(game);
    expect(life(game, B)).toBe(19);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: commander }]);
    settle(game);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-5000 batch 18 — Displace", () => {
  it("blinks a lone target when only one is chosen", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 2 };
    game.debugApplyEffect(A, effectOf("Displace"), [{ kind: "object", object: bears }]);
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(counters(game, back[0])).toBe(0);
  });
});

describe("top-5000 batch 18 — mana abilities", () => {
  it("Urza's Workshop counts Urza's lands, only with metalcraft", () => {
    const { game } = setUp();
    const workshop = spawn(game, "Urza's Workshop");
    spawn(game, "Urza's Tower");
    spawn(game, "Sol Ring");
    spawn(game, "Mind Stone");
    const canTap = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === workshop && x.abilityIndex === 1);
    expect(canTap()).toBe(false);
    spawn(game, "Ornithopter");
    expect(canTap()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: workshop, abilityIndex: 1 });
    expect(pool(game)).toEqual(["C", "C"]);
  });

  it("Treasonous Ogre pays 3 life a red", () => {
    const { game } = setUp();
    const ogre = spawn(game, "Treasonous Ogre");
    game.dispatch({ type: "activate-ability", player: A, source: ogre, abilityIndex: 0 });
    game.dispatch({ type: "activate-ability", player: A, source: ogre, abilityIndex: 0 });
    expect(pool(game)).toEqual(["R", "R"]);
    expect(life(game, A)).toBe(14);
  });

  it("Tarnished Citadel's colour costs 3 damage", () => {
    const { game } = setUp();
    const citadel = spawn(game, "Tarnished Citadel");
    game.dispatch({ type: "activate-ability", player: A, source: citadel, abilityIndex: 1, manaColors: ["B"] });
    expect(pool(game)).toEqual(["B"]);
    expect(life(game, A)).toBe(17);
  });

  it("Manamorphose adds two mana of the colours chosen, then draws", () => {
    const { game } = setUp(["Manamorphose"], "Mountain");
    lands(game, "Mountain", 2);
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Manamorphose"), targets: [] });
    const picks = [3, 4];
    for (let guard = 0; guard < 20; guard += 1) {
      game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
      const awaiting = game.state.awaiting;
      if (awaiting === null) break;
      expect(awaiting.kind).toBe("choose-modes");
      game.dispatch({ type: "choose-modes", player: A, modes: [picks.shift()!] });
    }
    expect(picks).toHaveLength(0);
    expect(pool(game)).toEqual(["G", "R"]);
    expect(game.handOf(A)).toHaveLength(handBefore);
  });
});

describe("top-5000 batch 18 — It That Heralds the End", () => {
  it("takes {1} off a colorless spell of mana value 7 or more", () => {
    const { game } = setUp(["Ulamog, the Ceaseless Hunger"]);
    lands(game, "Wastes", 9);
    const ulamog = inHand(game, "Ulamog, the Ceaseless Hunger");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === ulamog);
    expect(castable()).toBe(false);
    spawn(game, "It That Heralds the End");
    expect(castable()).toBe(true);
  });
});

describe("top-5000 batch 18 — Blacksmith's Skill", () => {
  it("pumps only an artifact creature, and protects anything", () => {
    const { game } = setUp();
    const thopter = spawn(game, "Ornithopter");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Blacksmith's Skill"), [{ kind: "object", object: thopter }]);
    game.debugApplyEffect(A, effectOf("Blacksmith's Skill"), [{ kind: "object", object: bears }]);
    settle(game);
    const t = computeCharacteristics(game.state, registry, thopter);
    const b = computeCharacteristics(game.state, registry, bears);
    expect([t.power, t.toughness]).toEqual([2, 4]);
    expect([b.power, b.toughness]).toEqual([2, 2]);
    expect(b.keywords.has("hexproof") && b.keywords.has("indestructible")).toBe(true);
  });
});

describe("top-5000 batch 18 — Kokusho, the Evening Star", () => {
  it("drains each opponent for 5 as it dies", () => {
    const { game } = setUp();
    const kokusho = spawn(game, "Kokusho, the Evening Star");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: kokusho }]);
    settle(game);
    expect(life(game, B)).toBe(15);
    expect(life(game, A)).toBe(25);
  });
});

describe("top-5000 batch 18 — Vraska's Fall", () => {
  it("has each opponent sacrifice and take a poison counter", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effectOf("Vraska's Fall"), []);
    // An edict's choice is made as a player would next get priority.
    (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.players[B].counters.poison).toBe(1);
    expect(game.state.players[A].counters.poison).toBeUndefined();
  });
});
