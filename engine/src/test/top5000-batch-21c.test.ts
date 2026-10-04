/**
 * Top-5000 batch 21c — existing vocabulary only. Pins the clause of each card
 * most likely to be wired wrong: a granted mana ability over "land and Ally"
 * (Great Divide Guide), a sacrifice of five that may include the source (Time
 * Sieve), a may-pay with a Unicorn check (Emiel), the counter-unless amount
 * read after the counters (Repulsive Mutation), and so on.
 */
import { describe, expect, it } from "vitest";

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
const hasKeyword = (game: Game, id: ObjectId, keyword: string): boolean =>
  game.characteristics(id).keywords.has(keyword as never);
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
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
const canActivate = (game: Game, source: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source);

describe("top-5000 batch 21c — Great Divide Guide", () => {
  it("gives its mana ability to lands and Allies, itself included, and not to other creatures", () => {
    const { game } = setUp();
    const guide = spawn(game, "Great Divide Guide");
    const bears = spawn(game, "Grizzly Bears");
    expect(canActivate(game, guide)).toBe(true);
    expect(canActivate(game, bears)).toBe(false);
  });
});

describe("top-5000 batch 21c — Time Sieve", () => {
  it("sacrifices itself as one of the five artifacts and takes an extra turn", () => {
    const { game } = setUp();
    const sieve = spawn(game, "Time Sieve");
    const thopters = lands(game, "Ornithopter", 3);
    expect(canActivate(game, sieve)).toBe(false);
    thopters.push(spawn(game, "Ornithopter"));
    expect(canActivate(game, sieve)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: sieve, abilityIndex: 0 });
    settle(game);
    expect(zone(game, sieve)).toBe("graveyard");
    for (const id of thopters) expect(zone(game, id)).toBe("graveyard");
    expect(game.state.extraTurns).toEqual([A]);
  });
});

describe("top-5000 batch 21c — Emiel the Blessed", () => {
  it("pays {G/W} for one counter, or two on a Unicorn", () => {
    const { game } = setUp();
    spawn(game, "Emiel the Blessed");
    lands(game, "Plains", 2);
    const unicorn = game.debugSpawn("Capashen Unicorn", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, unicorn)).toBe(2);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, bears)).toBe(1);
  });

  it("blinks another creature you control, which returns fresh and triggers the counter again", () => {
    const { game } = setUp();
    const emiel = spawn(game, "Emiel the Blessed");
    lands(game, "Plains", 4);
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 3 };
    game.dispatch({ type: "activate-ability", player: A, source: emiel, abilityIndex: 0, targets: [obj(bears)] });
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(counters(game, back[0])).toBe(1);
  });
});

describe("top-5000 batch 21c — Repulsive Mutation", () => {
  it("asks for the greatest power counted after its own counters", () => {
    const { game } = setUp(["Hill Giant"], "Mountain");
    lands(game, "Mountain", 4);
    const giant = inHand(game, "Hill Giant");
    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [] });
    expect(zone(game, giant)).toBe("stack");
    lands(game, "Wastes", 4);
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Repulsive Mutation"), [obj(bears), obj(giant)], { x: 2 });
    expect(counters(game, bears)).toBe(2);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    if (awaiting?.kind !== "choose-modes") return;
    expect(awaiting.player).toBe(A);
    expect(awaiting.cost).toBe("{4}");
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(zone(game, giant)).toBe("graveyard");
  });
});

describe("top-5000 batch 21c — Raise the Past", () => {
  it("returns only creature cards of mana value 2 or less", () => {
    const { game } = setUp();
    const elves = game.debugSpawn("Llanowar Elves", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugApplyEffect(A, effectOf("Raise the Past"));
    settle(game);
    expect(zone(game, elves)).toBe("battlefield");
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, giant)).toBe("graveyard");
  });
});

describe("top-5000 batch 21c — Sulfuric Vortex", () => {
  it("stops every player's life gain and burns the player whose upkeep it is", () => {
    const { game } = setUp();
    spawn(game, "Sulfuric Vortex");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    expect(life(game, A)).toBe(20);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 21c — Emeria's Call", () => {
  it("makes two Angel Warriors and makes only non-Angels indestructible", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effectOf("Emeria's Call"));
    settle(game);
    const angels = named(game, "Angel Warrior Token");
    expect(angels.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    expect(hasKeyword(game, bears, "indestructible")).toBe(true);
    expect(hasKeyword(game, theirs, "indestructible")).toBe(false);
    expect(hasKeyword(game, angels[0], "indestructible")).toBe(false);
  });
});

describe("top-5000 batch 21c — Mirrorpool", () => {
  it("sacrifices itself to make a token copy of a creature you control", () => {
    const { game } = setUp();
    const pool = spawn(game, "Mirrorpool");
    game.state.objects[pool].tapped = false; // it enters tapped
    lands(game, "Wastes", 5);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: pool, abilityIndex: 2, targets: [obj(bears)] });
    settle(game);
    expect(zone(game, pool)).toBe("graveyard");
    expect(named(game, "Grizzly Bears")).toHaveLength(2);
  });
});
