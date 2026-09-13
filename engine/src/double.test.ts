/**
 * "Double" (the EDH-popularity backlog's Tier-1 #4, `neededCards-features.md`):
 * a one-shot mass effect that reads each matching permanent's own current
 * value and adds that much again — distinct from Doubling Season's
 * *replacement*-based multiplier, which still composes on top of it. Two
 * new `EffectSpec` kinds: `double-counters-all` (Kalonian Hydra, Bristly
 * Bill) and `double-pt-all` (Unnatural Growth, reading current computed P/T
 * rather than a shared fixed amount — the gap the old P16 note flagged
 * against World War Hulk's dropped chapter III).
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";

const makeGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return { game, a, b };
};

const settle = (game: Game): void =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

describe("Kalonian Hydra", () => {
  it("enters with four +1/+1 counters, and attacking doubles +1/+1 counters on every creature you control", () => {
    const { game, a } = makeGame([]);
    const hydra = game.debugSpawn("Kalonian Hydra", A, "battlefield", { summoningSick: false });
    expect(game.state.objects[hydra]?.counters["+1/+1"]).toBe(4);

    const bear = game.debugSpawn("Prodigal Sorcerer", A);
    game.state.objects[bear]!.counters["+1/+1"] = 3;
    const theirs = game.debugSpawn("Prodigal Sorcerer", B, "battlefield", { summoningSick: false });
    game.state.objects[theirs]!.counters["+1/+1"] = 5;

    a.declareAttackersFn = () => [{ attacker: hydra, defender: B }];
    game.advanceUntil(toPostcombat);

    expect(game.state.objects[hydra]?.counters["+1/+1"]).toBe(8);
    expect(game.state.objects[bear]?.counters["+1/+1"]).toBe(6);
    // Bob's creature isn't controlled by Alice, so it's untouched.
    expect(game.state.objects[theirs]?.counters["+1/+1"]).toBe(5);
  });

  it("a creature with no +1/+1 counters is untouched (0 doubled is still 0)", () => {
    const { game, a } = makeGame([]);
    const hydra = game.debugSpawn("Kalonian Hydra", A, "battlefield", { summoningSick: false });
    const bear = game.debugSpawn("Prodigal Sorcerer", A);
    expect(game.state.objects[bear]?.counters["+1/+1"] ?? 0).toBe(0);

    a.declareAttackersFn = () => [{ attacker: hydra, defender: B }];
    game.advanceUntil(toPostcombat);

    expect(game.state.objects[bear]?.counters["+1/+1"] ?? 0).toBe(0);
  });
});

describe("Bristly Bill, Spine Sower", () => {
  it("landfall puts a counter on target creature; the activated ability doubles all of them", () => {
    const { game } = makeGame(["Forest", "Forest", "Forest", "Forest", "Forest"]);
    const bill = game.debugSpawn("Bristly Bill, Spine Sower", A);
    for (let i = 0; i < 5; i++) game.debugSpawn("Forest", A);

    // Only Bill is a legal target, so the ScriptedController's default
    // targeter has no real choice to make.
    const land = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Forest")!;
    game.dispatch({ type: "play-land", player: A, card: land });
    settle(game);
    expect(game.state.objects[bill]?.counters["+1/+1"]).toBe(1);

    const doubleAction = game
      .legalActions(A)
      .find((act) => act.kind === "activate-ability" && act.source === bill);
    expect(doubleAction?.kind).toBe("activate-ability");
    if (doubleAction?.kind !== "activate-ability") throw new Error("no double ability");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: bill,
      abilityIndex: doubleAction.abilityIndex,
    });
    settle(game);
    expect(game.state.objects[bill]?.counters["+1/+1"]).toBe(2);
  });
});

describe("Unnatural Growth", () => {
  it("doubles the power and toughness of each creature you control at the beginning of every combat, expiring end of turn", () => {
    const { game } = makeGame([]);
    game.debugSpawn("Unnatural Growth", A);
    const bear = game.debugSpawn("Prodigal Sorcerer", A, "battlefield", { summoningSick: false });
    const before = game.viewFor(A).objects[bear];
    const basePower = before?.power ?? 0;
    const baseToughness = before?.toughness ?? 0;

    game.advanceUntil((s) => s.turn.step === "begin-combat" && s.turn.number === 1);
    settle(game);

    const doubled = game.viewFor(A).objects[bear];
    expect(doubled?.power).toBe(basePower * 2);
    expect(doubled?.toughness).toBe(baseToughness * 2);

    // Expires at cleanup — back to base by the next precombat main.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const restored = game.viewFor(A).objects[bear];
    expect(restored?.power).toBe(basePower);
    expect(restored?.toughness).toBe(baseToughness);
  });

  it("also doubles on an opponent's combat (each combat, not just yours)", () => {
    const { game } = makeGame([], []);
    game.debugSpawn("Unnatural Growth", A);
    const bear = game.debugSpawn("Prodigal Sorcerer", A, "battlefield", { summoningSick: false });
    const basePower = game.viewFor(A).objects[bear]?.power ?? 0;

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "begin-combat");
    settle(game);

    expect(game.viewFor(A).objects[bear]?.power).toBe(basePower * 2);
  });
});
