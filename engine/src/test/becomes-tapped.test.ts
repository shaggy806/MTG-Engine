/**
 * "Whenever ~ becomes tapped" (rule 701.21a), and the path that was missing it.
 *
 * Declaring an attacker taps it, so the trigger has to fire there — which is
 * the *commonest* way a creature gets tapped and was the one path that set the
 * flag without emitting `permanent-tapped`. Emmara, Soul of the Accord made no
 * Soldier when it attacked, reported from a real game.
 *
 * Vigilance is the other half: a vigilant attacker never becomes tapped, so it
 * must not trigger.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const newGame = (): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    decks: [
      { player: A, cards: Array(40).fill("Forest") },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });

const tokensOf = (game: Game, player: string): string[] =>
  game.state.zones.shared.battlefield
    .filter((id) => game.state.objects[id].controller === player && game.state.objects[id].isToken)
    .map((id) => game.state.objects[id].cardName);

/** Get to A's declare-attackers step with `id` able to attack. */
const attackWith = (game: Game, id: ObjectId): void => {
  game.state.objects[id].summoningSick = false;
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
  game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: id, defender: B }] });
};

describe("becomes-tapped triggers", () => {
  it("fires when the creature is tapped by attacking", () => {
    const game = newGame();
    const emmara = game.debugSpawn("Emmara, Soul of the Accord", A);
    expect(tokensOf(game, A)).toHaveLength(0);

    attackWith(game, emmara);
    game.advanceUntil((s) => s.turn.step !== "declare-attackers");

    expect(game.state.objects[emmara].tapped).toBe(true);
    expect(tokensOf(game, A)).toContain("Lifelink Soldier Token");
  });

  it("does not fire for a vigilant attacker, which never becomes tapped", () => {
    const game = newGame();
    const emmara = game.debugSpawn("Emmara, Soul of the Accord", A);
    // Vigilance is what decides it: the rule is about the *tap*, not the
    // attack, so a creature that attacks without tapping makes no Soldier.
    game.state.objects[emmara].modifiers = [
      { power: 0, toughness: 0, keywords: ["vigilance"] },
    ];

    attackWith(game, emmara);
    game.advanceUntil((s) => s.turn.step !== "declare-attackers");

    expect(game.state.objects[emmara].tapped).toBe(false);
    expect(tokensOf(game, A)).toHaveLength(0);
  });
});
