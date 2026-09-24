/**
 * Niv-Mizzet, Visionary: no maximum hand size, and "whenever a source you
 * control deals noncombat damage to an opponent, you draw that many cards" —
 * a `deals-damage` trigger. The trigger's rules (prevention, one per
 * opponent, combat damage excluded) are in `damage-trigger-extensions.test.ts`.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const NIV = "Niv-Mizzet, Visionary";

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(60).fill("Mountain") },
      { player: B, cards: Array<string>(60).fill("Mountain") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("Niv-Mizzet, Visionary", () => {
  it("a pinger's ability draws a card per point to an opponent, and the hand keeps them all", () => {
    const { game } = setUp();
    game.debugSpawn(NIV, A);
    const bombardment = game.debugSpawn("Goblin Bombardment", A);
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "damage", amount: 5, target: 0 }, [{ kind: "player", player: B }], {
      source: bombardment as ObjectId,
    });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(before + 5);
    // Past cleanup with 13 cards in hand and no discard.
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.handOf(A).length).toBe(before + 5);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(0);
  });
});
