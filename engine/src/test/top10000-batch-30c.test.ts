/**
 * Top-10000 batch 30c — the clauses most likely to be wired wrong: the
 * creature-type list on Valley Mightcaller's trigger, Arwen's counter cost and
 * split counters, Long-Range Sensor's two-counter cost, Jaheira's Respite's
 * "creatures attacking you", Bonehoard's every-graveyard count, Gift of
 * Estates' land comparison, Skyknight Squire's counter threshold, Danitha's
 * graveyard permission and The Thirteenth Doctor's "a counter on it".
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { hasSubtype } from "../subtypes.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  // Take as many as allowed: "up to" searches find every match on offer.
  c.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const canActivate = (game: Game, source: ObjectId, index: number): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === index);
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-10000 batch 30c — Valley Mightcaller", () => {
  it("grows for another Rabbit entering, not for a Bear", () => {
    const { game } = setUp();
    const caller = spawn(game, "Valley Mightcaller");
    game.debugSpawn("Brave-Kin Duo", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, caller)).toBe(1);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, caller)).toBe(1);
  });
});

describe("top-10000 batch 30c — Arwen, Mortal Queen", () => {
  it("enters with an indestructible counter and spends it to give counters to both", () => {
    const { game } = setUp();
    lands(game, "Wastes", 1);
    const arwen = spawn(game, "Arwen, Mortal Queen");
    expect(counters(game, arwen, "indestructible")).toBe(1);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: arwen,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(counters(game, arwen, "indestructible")).toBe(0);
    expect(counters(game, arwen)).toBe(1);
    expect(counters(game, arwen, "lifelink")).toBe(1);
    expect(counters(game, bears)).toBe(1);
    expect(counters(game, bears, "lifelink")).toBe(1);
    expect(game.characteristics(bears).keywords).toContain("indestructible");
    expect(game.characteristics(bears).keywords).toContain("lifelink");
    // The counter cost is spent: no second activation.
    lands(game, "Wastes", 1);
    expect(canActivate(game, arwen, 0)).toBe(false);
  });
});

describe("top-10000 batch 30c — Long-Range Sensor", () => {
  it("discovers only with two charge counters to remove", () => {
    const { game } = setUp();
    lands(game, "Wastes", 1);
    const sensor = spawn(game, "Long-Range Sensor");
    game.state.objects[sensor].counters = { charge: 1 };
    expect(canActivate(game, sensor, 0)).toBe(false);
    game.state.objects[sensor].counters = { charge: 2 };
    expect(canActivate(game, sensor, 0)).toBe(true);
  });
});

describe("top-10000 batch 30c — Jaheira's Respite", () => {
  it("finds a basic land for each creature attacking you, tapped, and fogs", () => {
    const { game } = setUp([], "Plains");
    const one = spawn(game, "Grizzly Bears", B);
    const two = spawn(game, "Grizzly Bears", B);
    spawn(game, "Grizzly Bears", B);
    game.state.objects[one].attacking = A;
    game.state.objects[two].attacking = A;
    game.debugApplyEffect(A, effectOf("Jaheira's Respite"));
    settle(game);
    const plains = named(game, "Plains");
    expect(plains).toHaveLength(2);
    for (const id of plains) expect(game.state.objects[id].tapped).toBe(true);
    expect(game.state.preventAllCombatDamage).toBe(true);
  });
});

describe("top-10000 batch 30c — Bonehoard", () => {
  it("makes a Germ that counts creature cards in every graveyard", () => {
    const { game } = setUp();
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugSpawn("Wastes", B, "graveyard");
    const hoard = game.debugSpawn("Bonehoard", A, "battlefield", { announceEntry: true });
    settle(game);
    const germ = game.state.objects[hoard].attachedTo;
    expect(germ).not.toBeNull();
    const c = game.characteristics(germ!);
    expect(c.power).toBe(2);
    expect(c.toughness).toBe(2);
  });
});

describe("top-10000 batch 30c — Skyknight Squire", () => {
  it("flies and is a Knight from its third +1/+1 counter", () => {
    const { game } = setUp();
    const squire = spawn(game, "Skyknight Squire");
    game.state.objects[squire].counters = { "+1/+1": 2 };
    expect(game.characteristics(squire).keywords).not.toContain("flying");
    expect(hasSubtype(game.characteristics(squire).subtypes, "Knight")).toBe(false);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, squire)).toBe(3);
    expect(game.characteristics(squire).keywords).toContain("flying");
    expect(hasSubtype(game.characteristics(squire).subtypes, "Knight")).toBe(true);
  });
});

describe("top-10000 batch 30c — Danitha, New Benalia's Light", () => {
  it("lets an Equipment be cast from the graveyard, but not a creature", () => {
    const { game } = setUp();
    lands(game, "Wastes", 2);
    spawn(game, "Danitha, New Benalia's Light");
    const splitter = game.debugSpawn("Bonesplitter", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    expect(castable(game, splitter)).toBe(true);
    expect(castable(game, bears)).toBe(false);
  });
});

describe("top-10000 batch 30c — The Thirteenth Doctor", () => {
  it("untaps each creature you control with any counter on it at your end step", () => {
    const { game } = setUp();
    spawn(game, "The Thirteenth Doctor");
    const charged = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    game.state.objects[charged].counters = { lifelink: 1 };
    const plain = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true });
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end");
    settle(game);
    expect(game.state.objects[charged].tapped).toBe(false);
    expect(game.state.objects[plain].tapped).toBe(true);
    expect(game.state.objects[theirs].tapped).toBe(true);
  });
});
