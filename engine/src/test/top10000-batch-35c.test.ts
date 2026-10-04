/**
 * Top-10000 batch 35c — the clauses most likely to be wired wrong: Massive
 * Raid's count, Thran Vigil's batched leave-graveyard trigger on your turn,
 * Sister Hospitaller's life gain read from the returned card, and Sarkhan
 * Unbroken's +1 drawing then adding mana.
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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
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

describe("top-10000 batch 35c — Massive Raid", () => {
  it("deals damage equal to the number of creatures you control", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effectOf("Massive Raid"), [{ kind: "player", player: B }]);
    expect(life(game, B)).toBe(17);
  });
});

describe("top-10000 batch 35c — Thran Vigil", () => {
  it("puts a +1/+1 counter on your creature when an artifact card leaves your graveyard on your turn", () => {
    const { game } = setUp();
    spawn(game, "Thran Vigil");
    const bears = spawn(game, "Grizzly Bears");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: ring }]);
    settle(game);
    expect(counters(game, bears)).toBe(1);
  });
});

describe("top-10000 batch 35c — Sister Hospitaller", () => {
  it("returns the creature card and gains life equal to its mana value", () => {
    const { game } = setUp();
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugSpawn("Sister Hospitaller", A, "battlefield", { summoningSick: false, announceEntry: true });
    settle(game);
    expect(zone(game, giant)).toBe("battlefield");
    expect(life(game, A)).toBe(24);
  });
});

describe("top-10000 batch 35c — Sarkhan Unbroken", () => {
  it("+1 draws a card, then adds one mana", () => {
    const { game } = setUp();
    const sarkhan = spawn(game, "Sarkhan Unbroken");
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: sarkhan, abilityIndex: 0 });
    settle(game);
    expect(game.handOf(A).length).toBe(handBefore + 1);
    expect(game.state.players[A].manaPool.length).toBe(1);
    expect(counters(game, sarkhan, "loyalty")).toBe(5);
  });
});
