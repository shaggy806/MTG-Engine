/**
 * Top-10000 batch 32f. No engine change: each test pins the clause of an
 * authored card most likely to be wired wrong — Cavalier of Dawn's Golem
 * (its controller's, and none with no target), The Watcher in the Water's
 * stun counters and opponent's-turn draws, Cait Sith's reflexive +X/+0,
 * Spitting Dilophosaurus's "with -1/-1 counters" block restriction,
 * Pollenbright Druid's proliferate mode and Fungal Sprouting's X.
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
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
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
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const settle = (game: Game, player: PlayerId = A): void => {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(player);
  game.advanceUntil(quiet);
};
/** Put `name` onto the battlefield from its owner's hand as a real entry, so
 * its replacements apply and its enters triggers fire. */
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.debugApplyEffect(player, { kind: "put-onto-battlefield", target: 0 }, [obj(card)]);
  settle(game, player);
  return card;
};
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
/** How many tokens of `name` — a token stack counts as every token in it. */
const tokenCount = (game: Game, name: string, player?: PlayerId): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const counters = (game: Game, id: ObjectId, kind: string): number => game.state.objects[id].counters?.[kind] ?? 0;
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;

describe("top-10000 batch 32f — Cavalier of Dawn", () => {
  it("destroys the target and its controller gets the Golem", () => {
    const { game, a } = setUp();
    const ring = spawn(game, "Sol Ring", B);
    a.chooseTargetsFn = () => [obj(ring)];
    enter(game, "Cavalier of Dawn");
    expect(game.state.objects[ring].zone).toBe("graveyard");
    expect(tokenCount(game, "Golem Token", B)).toBe(1);
    expect(tokenCount(game, "Golem Token", A)).toBe(0);
  });

  it("with no target chosen, nobody gets a Golem", () => {
    const { game, a } = setUp();
    spawn(game, "Sol Ring", B);
    a.chooseTargetsFn = () => [null];
    enter(game, "Cavalier of Dawn");
    expect(tokenCount(game, "Golem Token")).toBe(0);
  });
});

describe("top-10000 batch 32f — The Watcher in the Water", () => {
  it("enters tapped with nine stun counters", () => {
    const { game } = setUp();
    const watcher = enter(game, "The Watcher in the Water");
    expect(game.state.objects[watcher].tapped).toBe(true);
    expect(counters(game, watcher, "stun")).toBe(9);
  });

  it("makes a Tentacle for a draw on an opponent's turn, not on its own", () => {
    const { game } = setUp();
    enter(game, "The Watcher in the Water");
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    expect(tokenCount(game, "Tentacle Token")).toBe(0);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game, B);
    expect(tokenCount(game, "Tentacle Token", A)).toBe(1);
  });

  it("a Tentacle dying takes a stun counter off the Watcher and puts one on a nonland permanent", () => {
    const { game, a } = setUp();
    const watcher = enter(game, "The Watcher in the Water");
    const ring = spawn(game, "Sol Ring", B);
    game.debugApplyEffect(A, { kind: "create-token", token: "Tentacle Token", count: 1 }, []);
    settle(game);
    const tentacle = named(game, "Tentacle Token")[0];
    a.chooseTargetsFn = () => [obj(watcher), obj(ring)];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(tentacle)]);
    settle(game);
    // Untapping a permanent with a stun counter removes one instead.
    expect(game.state.objects[watcher].tapped).toBe(true);
    expect(counters(game, watcher, "stun")).toBe(8);
    expect(counters(game, ring, "stun")).toBe(1);
  });
});

describe("top-10000 batch 32f — Cait Sith, Fortune Teller", () => {
  it("exiles the top card and gives +X/+0 where X is its mana value", () => {
    const { game } = setUp();
    const cait = spawn(game, "Cait Sith, Fortune Teller");
    const giant = game.debugSpawn("Hill Giant", A, "library");
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "begin-combat" && quiet(s));
    expect(game.state.objects[giant].zone).toBe("exile");
    const c = computeCharacteristics(game.state, registry, cait);
    expect([c.power, c.toughness]).toEqual([3 + 4, 3]);
  });
});

describe("top-10000 batch 32f — Spitting Dilophosaurus", () => {
  it("puts a -1/-1 counter on the target, and an opponent's creature with one can't block", () => {
    const { game, a } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    const bears = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Grizzly Bears", A);
    game.state.objects[mine].counters = { "-1/-1": 1 };
    a.chooseTargetsFn = () => [obj(giant)];
    enter(game, "Spitting Dilophosaurus");
    expect(counters(game, giant, "-1/-1")).toBe(1);
    const view = game.viewFor(B);
    expect(view.objects[giant]?.restrictions).toContain("cant-block");
    expect(view.objects[bears]?.restrictions ?? []).not.toContain("cant-block");
    expect(view.objects[mine]?.restrictions ?? []).not.toContain("cant-block");
  });
});

describe("top-10000 batch 32f — Pollenbright Druid", () => {
  it("the proliferate mode adds a counter of each kind already there", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    a.chooseModesFn = (_view, _min, _max, texts) => [texts.indexOf("Proliferate.")];
    enter(game, "Pollenbright Druid");
    expect(counters(game, bears, "+1/+1")).toBe(2);
  });

  it("the counter mode puts a +1/+1 counter on its target", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [obj(bears)];
    enter(game, "Pollenbright Druid");
    expect(counters(game, bears, "+1/+1")).toBe(1);
  });
});

describe("top-10000 batch 32f — Fungal Sprouting", () => {
  it("creates Saprolings equal to the greatest power among your creatures", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant");
    spawn(game, "Craw Wurm", B);
    game.debugApplyEffect(A, effectOf("Fungal Sprouting"), []);
    settle(game);
    expect(tokenCount(game, "Saproling Token", A)).toBe(3);
  });
});
