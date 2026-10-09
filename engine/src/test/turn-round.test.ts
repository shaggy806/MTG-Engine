import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

/**
 * `TurnState.round`: each player's turn once, from the starting player's seat
 * round to it again, is one round — how the client says how far a game has
 * gone, where a turn number counts every player's turns. No rule defines it.
 */

const [A, B, C, D] = ["alice", "bob", "carol", "dave"].map(asPlayerId);

function table(startingPlayer: PlayerId): Game {
  return Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer,
    decks: [A, B, C, D].map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
}

/** Whose turn it is, and its round. */
function now(game: Game): [PlayerId, number | undefined] {
  const { turn, turnOrder } = game.state;
  return [turnOrder[turn.activePlayerIndex], turn.round];
}

/** Plays on to the next turn's beginning. */
function nextTurn(game: Game): [PlayerId, number | undefined] {
  const number = game.state.turn.number;
  game.advanceUntil((s) => s.turn.number === number + 1);
  return now(game);
}

describe("the round (TurnState.round)", () => {
  it("counts from the starting player's seat, not the first seat", () => {
    const game = table(C);
    expect(game.state.turn.number).toBe(1);
    const turns = [now(game), ...Array.from({ length: 8 }, () => nextTurn(game))];
    expect(turns).toEqual([
      [C, 1], [D, 1], [A, 1], [B, 1],
      [C, 2], [D, 2], [A, 2], [B, 2],
      [C, 3],
    ]);
    const began = game.events.filter((e) => e.type === "turn-began");
    expect(began.map((e) => e.round)).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 3]);
  });

  it("keeps an extra turn in the round it's taken in", () => {
    const game = table(A);
    for (let i = 0; i < 3; i += 1) nextTurn(game); // A B C D, round 1
    game.state.extraTurns.push(D); // D's Time Warp, at the round's end
    expect(nextTurn(game)).toEqual([D, 1]);
    expect(game.state.turn.isExtra).toBe(true);
    game.state.extraTurns.push(B); // an extra turn for B, out of seat order
    expect(nextTurn(game)).toEqual([B, 1]);
    expect(nextTurn(game)).toEqual([A, 2]);
    expect(nextTurn(game)).toEqual([B, 2]);
  });

  it("passes over a seat that has left the game, the starting player's too", () => {
    const game = table(A);
    for (let i = 0; i < 2; i += 1) nextTurn(game); // A B C
    game.state.players[A].hasLost = true;
    expect(nextTurn(game)).toEqual([D, 1]);
    expect(nextTurn(game)).toEqual([B, 2]);
    expect(nextTurn(game)).toEqual([C, 2]);
    expect(nextTurn(game)).toEqual([D, 2]);
    expect(nextTurn(game)).toEqual([B, 3]);
  });

  it("goes on from the turn number on a state saved before rounds were kept", () => {
    const game = table(A);
    for (let i = 0; i < 5; i += 1) nextTurn(game); // A B C D A B: round 2
    delete game.state.turn.round;
    expect(nextTurn(game)).toEqual([C, 2]);
    expect(nextTurn(game)).toEqual([D, 2]);
    expect(nextTurn(game)).toEqual([A, 3]);
  });
});
