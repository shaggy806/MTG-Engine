/**
 * Conceding (rule 104.3a): a player may concede at any time, losing and
 * leaving the game at once (800.4a). `Game.concede` refuses only while they
 * owe a decision (the server answers it for them first) and before the game
 * has begun.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const makeGame = (players: readonly PlayerId[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

describe("conceding", () => {
  it("in a two-player game ends it, the other player winning", () => {
    const game = makeGame([A, B]);
    const events = game.concede(B);
    expect(events.some((e) => e.type === "player-lost" && e.player === B)).toBe(true);
    expect(game.state.players[B].lossReason).toBe("conceded");
    expect(game.state.result).toMatchObject({ over: true, winner: A });
  });

  it("in multiplayer takes their permanents with them and the game goes on", () => {
    const game = makeGame([A, B, C]);
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.concede(B);
    expect(game.state.result.over).toBe(false);
    expect(game.state.players[B].hasLost).toBe(true);
    // Their turn never begins (800.4k): Carol plays next.
    expect(game.state.objects[bears].owner).toBe(B);
    game.advanceUntil((s) => s.turn.number === 2 || s.result.over);
    expect(activePlayerOf(game.state)).toBe(C);
  });

  it("passes priority on when the conceding player holds it (rule 800.4a)", () => {
    const game = makeGame([A, B, C]);
    expect(game.state.priority.holder).toBe(A);
    game.concede(A);
    expect(game.state.priority.holder).toBe(B);
    expect(game.state.result.over).toBe(false);
  });

  it("is refused to a player who has already left, or after the game ends", () => {
    const game = makeGame([A, B, C]);
    game.concede(C);
    expect(game.whyCannotConcede(C)).toMatch(/already left/);
    game.concede(B);
    expect(game.whyCannotConcede(A)).toMatch(/over/);
  });
});
