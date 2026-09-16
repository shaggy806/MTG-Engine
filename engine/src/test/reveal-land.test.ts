/**
 * The "reveal land" cycle (Port Town, Game Trail, Foreboding Ruins, Fortified
 * Village): "As this land enters, you may reveal a [type] or [type] card from
 * your hand. If you don't, this land enters tapped."
 *
 * The condition reads the *hand*, which is what distinguishes it from the
 * check-land cycle's `tappedUnless` (a `StaticCondition` over the
 * battlefield). See `tappedUnlessRevealFromHand` in `replacements.ts`.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** A game where A's hand is exactly `hand` and nothing else. */
const gameWithHand = (hand: readonly string[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, openingHandSize: 0 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Grizzly Bears") },
      { player: B, cards: Array<string>(40).fill("Grizzly Bears") },
    ],
  });
  for (const card of hand) game.debugSpawn(card, A, "hand");
  return game;
};

const entersTapped = (game: Game, land: string, player: PlayerId = A): boolean => {
  const id = game.debugSpawn(land, player, "battlefield");
  return game.state.objects[id].tapped;
};

describe("reveal lands", () => {
  it("enters untapped when a matching card is in hand", () => {
    const game = gameWithHand(["Island"]);
    expect(entersTapped(game, "Port Town")).toBe(false);
  });

  it("enters untapped on the second of the two land types", () => {
    const game = gameWithHand(["Plains"]);
    expect(entersTapped(game, "Port Town")).toBe(false);
  });

  it("enters tapped on an empty hand", () => {
    const game = gameWithHand([]);
    expect(entersTapped(game, "Port Town")).toBe(true);
  });

  it("enters tapped when the hand holds only the wrong types", () => {
    const game = gameWithHand(["Mountain", "Forest", "Grizzly Bears"]);
    expect(entersTapped(game, "Port Town")).toBe(true);
  });

  it("reads subtypes, not names — a nonbasic Island counts", () => {
    // Underground River is typed as an Island? No — but Watery Grave is a
    // "Land — Island Swamp", so it satisfies "an Island card".
    const game = gameWithHand(["Watery Grave"]);
    expect(entersTapped(game, "Port Town")).toBe(false);
  });

  it("reads the controller's hand, not an opponent's", () => {
    const game = gameWithHand([]);
    game.debugSpawn("Island", B, "hand");
    expect(entersTapped(game, "Port Town")).toBe(true);
  });

  it("covers the whole cycle", () => {
    for (const [land, matching, wrong] of [
      ["Game Trail", "Mountain", "Island"],
      ["Foreboding Ruins", "Swamp", "Forest"],
      ["Fortified Village", "Forest", "Swamp"],
    ] as const) {
      expect(entersTapped(gameWithHand([matching]), land)).toBe(false);
      expect(entersTapped(gameWithHand([wrong]), land)).toBe(true);
    }
  });
});
