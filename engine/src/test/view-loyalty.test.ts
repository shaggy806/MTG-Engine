/**
 * A planeswalker's loyalty in a view: the number printed on the card while
 * it isn't on the battlefield (rule 306.5a), its loyalty counters once it is.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

describe("a planeswalker's loyalty in a view", () => {
  it("is its printed loyalty in a hand", () => {
    const game = setUp();
    const chandra = game.debugSpawn("Chandra, Acolyte of Flame", A, "hand");
    expect(game.viewFor(A).objects[chandra].loyalty).toBe(4);
  });

  it("is its loyalty counters on the battlefield", () => {
    const game = setUp();
    const chandra = game.debugSpawn("Chandra, Acolyte of Flame", A, "battlefield");
    game.state.objects[chandra].counters.loyalty = 2;
    expect(game.viewFor(A).objects[chandra].loyalty).toBe(2);
  });

  it("is null for anything else", () => {
    const game = setUp();
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    expect(game.viewFor(A).objects[bolt].loyalty).toBeNull();
  });
});
