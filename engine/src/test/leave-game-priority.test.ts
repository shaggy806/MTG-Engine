/**
 * A player who leaves the game never receives priority again (rule 800.4a),
 * and during their own turn the turn goes on without an active player
 * (800.4j). A player who lost to a state-based action in their own main
 * phase kept being handed priority back after each cast — a spell that could
 * go nowhere (their cards stay put, 800.4a), cast forever: "Game.advance
 * exceeded its budget", seed 617 of a v1 deck run. With that fixed, the same
 * game then waited on the lost player to declare attackers.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

describe("a player who leaves the game during their own turn", () => {
  it("never holds priority again, and the turn goes on without them", () => {
    const game = Game.create({
      seed: 1,
      registry,
      decks: [A, B, C].map((player) => ({ player, cards: Array<string>(40).fill("Swamp") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const turn = game.state.turn.number;
    game.state.zones.perPlayer[A].hand = [];
    const land = game.debugSpawn("Swamp", A, "hand");
    // A creature that could attack, and a hand past its maximum size.
    game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 9; i += 1) game.debugSpawn("Swamp", A, "hand");
    game.state.players[A].life = 0;
    // An action, after which the state-based actions see 0 life.
    game.dispatch({ type: "play-land", player: A, card: land });
    expect(game.state.players[A].hasLost).toBe(true);
    expect(game.state.priority.holder).not.toBe(A);
    expect(game.legalActions(A)).toEqual([]);
    // The turn finishes without an active player (800.4j): nobody is asked to
    // declare attackers or discard to hand size, and the next turn is bob's.
    game.advanceUntil((s) => s.turn.number > turn || s.result.over || s.awaiting !== null);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.turnOrder[game.state.turn.activePlayerIndex]).toBe(B);
  });
});

describe("what a player who has left the game leaves behind", () => {
  // Seed 5 of a four-player fuzz run: Boseiju, Who Endures's channel targeted
  // a land of a player who had lost, and its "that player may search" then
  // waited on them while the game went on.
  it("can't be targeted (rule 800.4a)", () => {
    const game = Game.create({
      seed: 1,
      registry,
      decks: [A, B, C].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const boseiju = game.debugSpawn("Boseiju, Who Endures", A, "hand");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const carolsLand = game.debugSpawn("Tarnished Citadel", C, "battlefield");
    const bobsLand = game.debugSpawn("Tarnished Citadel", B, "battlefield");
    const channelTargets = () =>
      game
        .legalActions(A)
        .flatMap((a) => (a.kind === "activate-ability" && a.source === boseiju ? a.targetOptions.flat() : []))
        .map((t) => (t.kind === "object" ? t.object : t.player));
    expect(channelTargets()).toContain(carolsLand);
    // An action, after which the state-based actions see carol's 0 life.
    const land = game.debugSpawn("Forest", A, "hand");
    game.state.players[C].life = 0;
    game.dispatch({ type: "play-land", player: A, card: land });
    expect(game.state.players[C].hasLost).toBe(true);
    expect(channelTargets()).toContain(bobsLand);
    expect(channelTargets()).not.toContain(carolsLand);
  });
});
