/**
 * `draw`'s player scoping and the `discard-hand` effect — the first time
 * anything but the effect's own controller draws, and the first "discard your
 * whole hand" with no choice attached.
 *
 * Unblocks Bloodgift Demon ("target player draws a card and loses 1 life"),
 * Stormfist Crusader ("each player draws a card and loses 1 life") and Dragon
 * Mage ("each player discards their hand, then draws seven cards") — see
 * `docs/plans/engine-gaps.md` phase A.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const deck = (): string[] => Array<string>(40).fill("Island");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99 },
    decks: [
      { player: A, cards: deck() },
      { player: B, cards: deck() },
    ],
  });

const handSize = (game: Game, player: ReturnType<typeof asPlayerId>) =>
  game.state.zones.perPlayer[player].hand.length;

const graveyardSize = (game: Game, player: ReturnType<typeof asPlayerId>) =>
  game.state.zones.perPlayer[player].graveyard.length;

describe("draw scoping", () => {
  it("draws for the controller by default", () => {
    const game = makeGame();
    const before = handSize(game, A);
    const beforeB = handSize(game, B);
    game.debugApplyEffect(A, { kind: "draw", amount: 2 });
    expect(handSize(game, A)).toBe(before + 2);
    expect(handSize(game, B)).toBe(beforeB);
  });

  it("draws for every player under `each-player`", () => {
    const game = makeGame();
    const before = { a: handSize(game, A), b: handSize(game, B) };
    game.debugApplyEffect(A, { kind: "draw", amount: 1, who: "each-player" });
    expect(handSize(game, A)).toBe(before.a + 1);
    expect(handSize(game, B)).toBe(before.b + 1);
  });

  it("skips the controller under `each-opponent`", () => {
    const game = makeGame();
    const before = { a: handSize(game, A), b: handSize(game, B) };
    game.debugApplyEffect(A, { kind: "draw", amount: 3, who: "each-opponent" });
    expect(handSize(game, A)).toBe(before.a);
    expect(handSize(game, B)).toBe(before.b + 3);
  });

  it("draws for a targeted player", () => {
    const game = makeGame();
    const before = { a: handSize(game, A), b: handSize(game, B) };
    game.debugApplyEffect(A, { kind: "draw", amount: 2, target: 0 }, [
      { kind: "player", player: B },
    ]);
    expect(handSize(game, A)).toBe(before.a);
    expect(handSize(game, B)).toBe(before.b + 2);
  });
});

describe("discard-hand", () => {
  it("puts a whole hand in the graveyard without raising a decision", () => {
    const game = makeGame();
    const handA = handSize(game, A);
    const graveA = graveyardSize(game, A);
    expect(handA).toBeGreaterThan(0);

    game.debugApplyEffect(A, { kind: "discard-hand", who: "each-player" });

    expect(handSize(game, A)).toBe(0);
    expect(handSize(game, B)).toBe(0);
    expect(graveyardSize(game, A)).toBe(graveA + handA);
    // The whole point of a separate effect: no `discard` choice to answer, so
    // "discard your hand, then draw seven" resolves in one pass.
    expect(game.state.awaiting).toBeNull();
  });

  it("is a no-op on an empty hand", () => {
    const game = makeGame();
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" });
    const graveA = graveyardSize(game, A);
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" });
    expect(graveyardSize(game, A)).toBe(graveA);
  });

  it("empties every hand and refills it, the Dragon Mage line", () => {
    const game = makeGame();
    game.debugApplyEffect(A, {
      kind: "sequence",
      effects: [
        { kind: "discard-hand", who: "each-player" },
        { kind: "draw", amount: 7, who: "each-player" },
      ],
    });
    expect(handSize(game, A)).toBe(7);
    expect(handSize(game, B)).toBe(7);
    expect(game.state.awaiting).toBeNull();
  });
});
