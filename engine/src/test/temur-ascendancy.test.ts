/**
 * Temur Ascendancy: "Whenever a creature you control with power 4 or greater
 * enters, you may draw a card." The draw is optional — it was authored as a
 * forced draw, which the text audit didn't flag ("may" was filler to it).
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (answer: number[]) => {
  const a = new ScriptedController(A);
  let asked = 0;
  a.chooseModesFn = () => {
    asked += 1;
    return answer;
  };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  game.debugSpawn("Temur Ascendancy", A, "battlefield");
  return { game, asked: () => asked };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("Temur Ascendancy", () => {
  it("asks, and draws when told to", () => {
    const { game, asked } = setUp([0]);
    const hand = game.handOf(A).length;
    game.debugSpawn("Colossal Dreadmaw", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(asked()).toBe(1);
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });

  it("draws nothing when declined", () => {
    const { game, asked } = setUp([]);
    const hand = game.handOf(A).length;
    game.debugSpawn("Colossal Dreadmaw", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(asked()).toBe(1);
    expect(game.handOf(A)).toHaveLength(hand);
  });

  it("doesn't trigger for a smaller creature", () => {
    const { game, asked } = setUp([0]);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(asked()).toBe(0);
  });
});
