/**
 * Top-10000 batch 33d. Authored from existing vocabulary only; these pin the
 * clauses most likely to be wired wrong — "with counters on them" as any kind
 * of counter (Tyrant Guard), a base P/T set under a counter (Restless
 * Vinestalk), Tenza's two host-gated statics, a nontoken-only death trigger
 * (Life Insurance), five independent graveyard slots (Reconstruct History) and
 * a loyalty ability that adds mana and then impulses one of three (Chandra,
 * Flameshaper).
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
const setUp = (): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const obj = (object: ObjectId) => ({ kind: "object", object }) as const;
const exiledBy = (game: Game, player: PlayerId): number =>
  Object.values(game.state.objects).filter((o) => o.owner === player && o.zone === "exile").length;
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
const activatedEffect = (name: string, i: number): EffectSpec => registry.get(name)!.activated[i].effect!;
const triggeredEffect = (name: string, i: number): EffectSpec => registry.get(name)!.triggered[i].effect!;

describe("top-10000 batch 33d — Tyrant Guard", () => {
  it("Shieldwall protects your creatures with any kind of counter, and only those", () => {
    const { game } = setUp();
    const plus = spawn(game, "Grizzly Bears");
    const minus = spawn(game, "Hill Giant");
    const bare = spawn(game, "Llanowar Elves");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[plus].counters = { "+1/+1": 1 };
    game.state.objects[minus].counters = { "-1/-1": 1 };
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, activatedEffect("Tyrant Guard", 0), []);
    settle(game);
    for (const id of [plus, minus]) {
      const c = computeCharacteristics(game.state, registry, id);
      expect(c.keywords.has("hexproof") && c.keywords.has("indestructible")).toBe(true);
    }
    for (const id of [bare, theirs]) {
      const c = computeCharacteristics(game.state, registry, id);
      expect(c.keywords.has("hexproof") || c.keywords.has("indestructible")).toBe(false);
    }
  });
});

describe("top-10000 batch 33d — Restless Vinestalk", () => {
  it("sets another creature's base P/T to 3/3, under its counters", () => {
    const { game } = setUp();
    const vinestalk = spawn(game, "Restless Vinestalk");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, triggeredEffect("Restless Vinestalk", 0), [obj(bears)], { source: vinestalk });
    settle(game);
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([4, 4]);
  });
});

describe("top-10000 batch 33d — Tenza, Godo's Maul", () => {
  it("gives a legendary red creature +3/+3 and trample, and a plain green one only +1/+1", () => {
    const { game } = setUp();
    const tenza = spawn(game, "Tenza, Godo's Maul");
    const krenko = spawn(game, "Krenko, Mob Boss");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "attach", target: 0 }, [obj(krenko)], { source: tenza });
    settle(game);
    const k = computeCharacteristics(game.state, registry, krenko);
    expect([k.power, k.toughness]).toEqual([6, 6]);
    expect(k.keywords.has("trample")).toBe(true);
    game.debugApplyEffect(A, { kind: "attach", target: 0 }, [obj(bears)], { source: tenza });
    settle(game);
    const b = computeCharacteristics(game.state, registry, bears);
    expect([b.power, b.toughness]).toEqual([3, 3]);
    expect(b.keywords.has("trample")).toBe(false);
    const k2 = computeCharacteristics(game.state, registry, krenko);
    expect([k2.power, k2.toughness]).toEqual([3, 3]);
  });
});

describe("top-10000 batch 33d — Life Insurance", () => {
  it("costs 1 life and makes a Treasure when a nontoken creature dies, not a token", () => {
    const { game } = setUp();
    spawn(game, "Life Insurance");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(life(game, A)).toBe(19);
    expect(named(game, "Treasure Token")).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "create-token", token: "Tyranid Token", count: 1 }, []);
    settle(game);
    const token = named(game, "Tyranid Token")[0];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(token)]);
    settle(game);
    expect(named(game, "Tyranid Token")).toHaveLength(0);
    expect(life(game, A)).toBe(19);
    expect(named(game, "Treasure Token")).toHaveLength(1);
  });
});

describe("top-10000 batch 33d — Reconstruct History", () => {
  it("returns one card of each type from your graveyard to your hand", () => {
    const { game } = setUp();
    const cards = ["Sol Ring", "Pacifism", "Lightning Bolt", "Divination", "Ajani, Caller of the Pride"].map((name) =>
      game.debugSpawn(name, A, "graveyard"),
    );
    game.debugApplyEffect(A, effectOf("Reconstruct History"), cards.map(obj));
    settle(game);
    for (const id of cards) expect(zone(game, id)).toBe("hand");
  });
});

describe("top-10000 batch 33d — Chandra, Flameshaper", () => {
  it("+2 adds {R}{R}{R} and exiles the top three cards of your library", () => {
    const { game } = setUp();
    const chandra = spawn(game, "Chandra, Flameshaper");
    const before = exiledBy(game, A);
    game.debugApplyEffect(A, activatedEffect("Chandra, Flameshaper", 0), [], { source: chandra });
    expect(pool(game)).toEqual(["R", "R", "R"]);
    settle(game);
    expect(exiledBy(game, A) - before).toBe(3);
  });
});
