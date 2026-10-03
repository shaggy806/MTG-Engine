/**
 * Two count-scaled bonuses (`grantPtPerCount`) counting each other: two
 * Zinnia, Valley's Voice, each "+X/+0, where X is the number of other
 * creatures you control with base power 1". Counting for one folds the other,
 * whose count folds the first — "Maximum call stack size exceeded" in a deck
 * autopsy's game with a copied Zinnia, until the `countInProgress` guard.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics, withComputedCache } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

function board() {
  const game = Game.create({
    seed: 1,
    registry,
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });
  game.advanceUntil((s) => s.priority.holder !== null);
  const first = game.debugSpawn("Zinnia, Valley's Voice", A, "battlefield");
  const second = game.debugSpawn("Zinnia, Valley's Voice", A, "battlefield");
  game.debugSpawn("Llanowar Elves", A, "battlefield");
  return { game, first, second };
}

describe("count-scaled bonuses that count each other", () => {
  it("fold without looping: each Zinnia counts the other and the Elves", () => {
    const { game, first, second } = board();
    // Base power 1 each, plus the other Zinnia and the Elves: +2/+0.
    expect(computeCharacteristics(game.state, registry, first).power).toBe(3);
    expect(computeCharacteristics(game.state, registry, second).power).toBe(3);
  });

  it("give the same answer through the computed cache", () => {
    const { game, first, second } = board();
    withComputedCache(() => {
      expect(computeCharacteristics(game.state, registry, first).power).toBe(3);
      expect(computeCharacteristics(game.state, registry, second).power).toBe(3);
      expect(computeCharacteristics(game.state, registry, first).power).toBe(3);
    });
  });
});
