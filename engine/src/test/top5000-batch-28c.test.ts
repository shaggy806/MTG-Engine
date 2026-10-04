/**
 * Top-5000 batch 28c. No engine change: each test pins the clause of one
 * newly authored card most likely to be wired wrong.
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
const many = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
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

describe("top-5000 batch 28c — Goblin War Strike", () => {
  it("deals damage equal to the number of Goblins you control", () => {
    const { game } = setUp();
    many(game, "Raging Goblin", 3);
    spawn(game, "Raging Goblin", B);
    game.debugApplyEffect(A, effectOf("Goblin War Strike"), [{ kind: "player", player: B }]);
    settle(game);
    expect(life(game, B)).toBe(17);
  });
});

describe("top-5000 batch 28c — Sami, Wildcat Captain", () => {
  it("gives every spell you cast affinity for artifacts", () => {
    const { game } = setUp(["Hill Giant"]);
    spawn(game, "Mountain");
    many(game, "Ornithopter", 3);
    const giant = inHand(game, "Hill Giant");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === giant);
    expect(castable()).toBe(false);
    spawn(game, "Sami, Wildcat Captain");
    expect(castable()).toBe(true);
  });
});

describe("top-5000 batch 28c — Darksteel Juggernaut", () => {
  it("is as big as the number of artifacts you control, itself included", () => {
    const { game } = setUp();
    const juggernaut = spawn(game, "Darksteel Juggernaut");
    many(game, "Sol Ring", 2);
    spawn(game, "Sol Ring", B);
    const c = computeCharacteristics(game.state, registry, juggernaut);
    expect([c.power, c.toughness]).toEqual([3, 3]);
  });
});

describe("top-5000 batch 28c — Kelpie Guide", () => {
  it("can tap a permanent only with eight or more lands", () => {
    const { game } = setUp();
    const kelpie = spawn(game, "Kelpie Guide");
    many(game, "Wastes", 7);
    const canTap = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === kelpie && x.abilityIndex === 1);
    expect(canTap()).toBe(false);
    spawn(game, "Wastes");
    expect(canTap()).toBe(true);
  });
});

describe("top-5000 batch 28c — Slaughter Specialist", () => {
  it("gives each opponent a Human, and grows when it dies", () => {
    const { game } = setUp();
    const specialist = game.debugSpawn("Slaughter Specialist", A, "battlefield", { announceEntry: true });
    settle(game);
    const humans = named(game, "Human Token");
    expect(humans).toHaveLength(1);
    expect(game.state.objects[humans[0]].controller).toBe(B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: humans[0] }]);
    settle(game);
    expect(counters(game, specialist)).toBe(1);
  });
});

describe("top-5000 batch 28c — Brallin, Skyshark Rider", () => {
  it("grows and pings each opponent once per card discarded", () => {
    const { game } = setUp();
    const brallin = spawn(game, "Brallin, Skyshark Rider");
    const discarded = game.handOf(A).length;
    expect(discarded).toBeGreaterThan(1);
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" });
    settle(game);
    expect(counters(game, brallin)).toBe(discarded);
    expect(life(game, B)).toBe(20 - discarded);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 28c — Shanid, Sleepers' Scourge", () => {
  it("draws and drains you for a legendary land played, not a nonlegendary one", () => {
    const { game } = setUp(["Gaea's Cradle", "Forest"]);
    spawn(game, "Shanid, Sleepers' Scourge");
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Gaea's Cradle") });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore);
    expect(life(game, A)).toBe(19);
    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Forest") });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore - 1);
    expect(life(game, A)).toBe(19);
  });

  it("gives other legendary creatures you control menace", () => {
    const { game } = setUp();
    spawn(game, "Shanid, Sleepers' Scourge");
    const legend = spawn(game, "Brallin, Skyshark Rider");
    const bears = spawn(game, "Grizzly Bears");
    expect(computeCharacteristics(game.state, registry, legend).keywords.has("menace")).toBe(true);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("menace")).toBe(false);
  });
});

describe("top-5000 batch 28c — Kellan, Inquisitive Prodigy", () => {
  it("draws for an artifact you controlled, even one that survives, and not for an opponent's", () => {
    const { game } = setUp();
    const kellan = spawn(game, "Kellan, Inquisitive Prodigy");
    const attack = registry.get("Kellan, Inquisitive Prodigy")!.triggered[0].effect!;
    const ingot = spawn(game, "Darksteel Ingot");
    const handBefore = game.handOf(A).length;
    game.debugApplyEffect(A, attack, [{ kind: "object", object: ingot }], { source: kellan });
    settle(game);
    expect(zone(game, ingot)).toBe("battlefield");
    expect(game.handOf(A)).toHaveLength(handBefore + 1);
    const ring = spawn(game, "Sol Ring", B);
    game.debugApplyEffect(A, attack, [{ kind: "object", object: ring }], { source: kellan });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(handBefore + 1);
  });
});
