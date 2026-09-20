/**
 * The Battlebond land cycle, and the `opponent-count` static condition it
 * needed.
 *
 * These lands are the only cards in the pool that ask about the *table* rather
 * than about any board state: "enters tapped unless you have two or more
 * opponents". That makes them untapped duals in a Commander pod and tapped
 * ones in a duel, so both directions are worth pinning — and so is the case a
 * naive count gets wrong, a four-player game that has shrunk to a duel.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const gameWith = (players: readonly PlayerId[]): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    decks: players.map((player) => ({ player, cards: pad(["Morphic Pool"]) })),
  });

/** Play the land through the real enters-battlefield path and report whether
 * it arrived tapped. */
const entersTapped = (game: Game, player: PlayerId): boolean => {
  const id = game.debugSpawn("Morphic Pool", player);
  return game.state.objects[id]!.tapped;
};

describe("Battlebond lands (opponent-count)", () => {
  it("enters untapped at a four-player table", () => {
    expect(entersTapped(gameWith([A, B, C, D]), A)).toBe(false);
  });

  it("enters untapped with exactly two opponents", () => {
    expect(entersTapped(gameWith([A, B, C]), A)).toBe(false);
  });

  it("enters tapped in a duel", () => {
    // One opponent is not "two or more" — this is the half that makes the
    // cycle a real cost rather than a strictly-better dual.
    expect(entersTapped(gameWith([A, B]), A)).toBe(true);
  });

  it("counts only opponents still in the game", () => {
    // A four-player game that has become a duel stops satisfying the
    // condition, which is what the printed card says and what a count over
    // `turnOrder` alone would get wrong.
    const game = gameWith([A, B, C, D]);
    game.state.players[C]!.hasLost = true;
    game.state.players[D]!.hasLost = true;
    expect(entersTapped(game, A)).toBe(true);
  });

  it("taps for either of its two colours", () => {
    const game = gameWith([A, B, C, D]);
    const id = game.debugSpawn("Morphic Pool", A);
    game.state.objects[id]!.tapped = false;
    // One `ManaOption` per alternative the tap ability offers, each carrying
    // the concrete mana it adds in `fixed`.
    const produced = game
      .manaSources(A)
      .filter((source) => source.id === id)
      .flatMap((source) => source.options.flatMap((option) => [...option.fixed]));
    expect(produced).toContain("U");
    expect(produced).toContain("B");
  });
});
