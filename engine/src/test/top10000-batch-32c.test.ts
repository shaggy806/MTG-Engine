/**
 * Top-10000 batch 32c — no engine change. Pins the clauses most likely to be
 * wired wrong: Village Pillagers' enters damage carrying wither and its
 * "with a counter on it" read off the dying creature; Go-Shintai of Hidden
 * Cruelty's reflexive target bounded by the Shrine count; Honden of Life's
 * Web's token count; Tishana's draw count and hand-size P/T; Riddlesmith's
 * optional loot; Grappling Kraken's tap-and-stun.
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

const setUp = (hand: readonly string[] = []): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const tokenCount = (game: Game, name: string): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === name)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const counters = (game: Game, id: ObjectId, kind: string): number => game.state.objects[id].counters?.[kind] ?? 0;
const triggerOf = (name: string, index = 0): EffectSpec => registry.get(name)!.triggered[index].effect!;

describe("top-10000 batch 32c — Village Pillagers", () => {
  it("its enters damage is wither, and only a dying opponent's creature with a counter makes a tapped Treasure", () => {
    const { game } = setUp();
    const elves = spawn(game, "Llanowar Elves", B);
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const mine = spawn(game, "Grizzly Bears", A);
    game.debugSpawn("Village Pillagers", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    // -1/-1 counters, not marked damage: the 1/1 dies, the 2/2s are 1/1s.
    expect(game.state.objects[elves].zone).toBe("graveyard");
    expect(counters(game, bears, "-1/-1")).toBe(1);
    expect(computeCharacteristics(game.state, registry, bears).toughness).toBe(1);
    expect(counters(game, mine, "-1/-1")).toBe(0);
    expect(tokenCount(game, "Treasure Token")).toBe(1);
    const treasure = game.battlefield.find((id) => game.state.objects[id].cardName === "Treasure Token")!;
    expect(game.state.objects[treasure].tapped).toBe(true);
    // The Bears die with a counter on them: another Treasure.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    game.advanceUntil(quiet);
    expect(tokenCount(game, "Treasure Token")).toBe(2);
    // A creature with no counter on it dying makes none.
    game.state.objects[giant].counters = {};
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    game.advanceUntil(quiet);
    expect(tokenCount(game, "Treasure Token")).toBe(2);
  });
});

describe("top-10000 batch 32c — Go-Shintai of Hidden Cruelty", () => {
  it("paying {1} lets it destroy a creature with toughness up to the Shrine count, and no bigger", () => {
    const { game, a } = setUp();
    const shintai = spawn(game, "Go-Shintai of Hidden Cruelty");
    spawn(game, "Honden of Life's Web");
    const land = spawn(game, "Wastes");
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    let offered: readonly ObjectId[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options[0].flatMap((t) => (t.kind === "object" ? [t.object] : []));
      return options.map((slot) => slot.find((t) => t.kind === "object" && t.object === bears) ?? null);
    };
    game.debugApplyEffect(A, triggerOf("Go-Shintai of Hidden Cruelty"), [], { source: shintai });
    game.advanceUntil(quiet);
    expect(game.state.objects[land].tapped).toBe(true);
    expect(offered).toContain(bears);
    expect(offered).not.toContain(giant);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[giant].zone).toBe("battlefield");
  });
});

describe("top-10000 batch 32c — Honden of Life's Web", () => {
  it("makes a colorless 1/1 Spirit for each Shrine you control", () => {
    const { game } = setUp();
    const honden = spawn(game, "Honden of Life's Web");
    spawn(game, "Go-Shintai of Hidden Cruelty");
    spawn(game, "Honden of Infinite Rage", B);
    game.debugApplyEffect(A, triggerOf("Honden of Life's Web"), [], { source: honden });
    game.advanceUntil(quiet);
    expect(tokenCount(game, "Spirit Token (Colorless)")).toBe(2);
  });
});

describe("top-10000 batch 32c — Tishana, Voice of Thunder", () => {
  it("draws one for each creature you control, itself included, and is as big as your hand", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears", B);
    const before = game.handOf(A).length;
    const tishana = game.debugSpawn("Tishana, Voice of Thunder", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const after = game.handOf(A).length;
    expect(after).toBe(before + 3);
    const c = computeCharacteristics(game.state, registry, tishana);
    expect(c.power).toBe(after);
    expect(c.toughness).toBe(after);
  });
});

describe("top-10000 batch 32c — Riddlesmith", () => {
  it("draws then discards when you say yes, and does neither when you don't", () => {
    const { game, a } = setUp();
    const smith = spawn(game, "Riddlesmith");
    const hand0 = game.handOf(A).length;
    const yard0 = game.graveyardOf(A).length;
    game.debugApplyEffect(A, triggerOf("Riddlesmith"), [], { source: smith });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand0);
    expect(game.graveyardOf(A).length).toBe(yard0 + 1);
    a.chooseModesFn = () => [];
    game.debugApplyEffect(A, triggerOf("Riddlesmith"), [], { source: smith });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand0);
    expect(game.graveyardOf(A).length).toBe(yard0 + 1);
  });
});

describe("top-10000 batch 32c — Grappling Kraken", () => {
  it("taps the target and puts a stun counter on it", () => {
    const { game } = setUp();
    const kraken = spawn(game, "Grappling Kraken");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, triggerOf("Grappling Kraken"), [{ kind: "object", object: bears }], { source: kraken });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(counters(game, bears, "stun")).toBe(1);
  });
});
