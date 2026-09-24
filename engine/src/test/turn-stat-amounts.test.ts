/**
 * The `turnStat` / `playersWithTurnStat` amounts: a per-turn running total
 * (`PlayerState.lifeLostThisTurn` / `lifeGainedThisTurn` /
 * `cardsDrawnThisTurn`) read as a number rather than the `turn-stat`
 * condition's threshold — Kydele's "{C} for each card you've drawn this
 * turn", "the life your opponents lost this turn", "for each opponent who
 * lost life this turn".
 */
import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const mkGame = (players: readonly PlayerId[]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({ player, cards: Array(40).fill("Island") })),
  });

const atMain = (s: GameState): boolean =>
  s.turn.step === "precombat-main" && s.priority.holder === A;

describe("turnStat amounts", () => {
  it("reads your own total, the sum across opponents, and how many opponents", () => {
    const game = mkGame([A, B, C]);
    game.advanceUntil(atMain);
    game.debugApplyEffect(A, { kind: "lose-life", amount: 2, who: "you" }, []);
    game.debugApplyEffect(B, { kind: "lose-life", amount: 5, who: "you" }, []);
    game.debugApplyEffect(C, { kind: "lose-life", amount: 1, who: "you" }, []);
    const start = game.state.players[A].life;

    game.debugApplyEffect(A, { kind: "gain-life", amount: { turnStat: "life-lost" } }, []);
    expect(game.state.players[A].life).toBe(start + 2);

    const before = game.state.players[A].life;
    game.debugApplyEffect(
      A,
      { kind: "gain-life", amount: { turnStat: "life-lost", who: "each-opponent" } },
      [],
    );
    expect(game.state.players[A].life).toBe(before + 6);

    const again = game.state.players[A].life;
    game.debugApplyEffect(
      A,
      {
        kind: "gain-life",
        amount: { playersWithTurnStat: "life-lost", who: "each-opponent" },
      },
      [],
    );
    // Two opponents lost life — 5 and 1 — and each counts once.
    expect(game.state.players[A].life).toBe(again + 2);
  });

  it("counts players with a nonzero total, you included for each-player", () => {
    const game = mkGame([A, B, C]);
    game.advanceUntil(atMain);
    game.debugApplyEffect(B, { kind: "gain-life", amount: 3, who: "you" }, []);
    const start = game.state.players[A].life;
    game.debugApplyEffect(
      A,
      { kind: "lose-life", amount: { playersWithTurnStat: "life-gained", who: "each-player" } },
      [],
    );
    expect(game.state.players[A].life).toBe(start - 1);
    game.debugApplyEffect(A, { kind: "draw", amount: 2 }, []);
    const drawn = game.state.players[A].cardsDrawnThisTurn;
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "draw", amount: { turnStat: "cards-drawn" } }, []);
    expect(game.handOf(A).length).toBe(hand + drawn);
  });
});
