/**
 * Which opponent the bot swings at, and when it declines to swing at all.
 *
 * Reported from a real game: a 2/2 commander attacked into an untapped 6/4 and
 * died for nothing. v1 chose its defender by *life total alone* — every player
 * starts at 40, so it simply took the first — with no notion of who could
 * block. That matters well beyond v1, because v1's declaration is also v2's
 * fallback and the first candidate v2 scores, so a cut-short search plays it.
 */

import { describe, expect, it } from "vitest";

import { EvalBotController } from "../bot/index.js";
import { HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

/** Alice has a lone 2/2; `guarded` players each hold an untapped 6/4. */
const boardWith = (players: readonly PlayerId[], guarded: readonly PlayerId[]): Game => {
  const game = Game.create({
    seed: 4,
    shuffle: false,
    // Pinned, so the first declare-attackers step is Alice's — otherwise the
    // bot is asked about a combat it isn't in and correctly declares nothing.
    startingPlayer: A,
    rules: { startingLife: 40 },
    decks: players.map((player) => ({ player, cards: Array(40).fill("Forest") })),
  });
  const mine = game.debugSpawn("Grizzly Bears", A); // 2/2
  game.state.objects[mine].summoningSick = false;
  for (const player of guarded) {
    const wurm = game.debugSpawn("Craw Wurm", player); // 6/4 — eats a 2/2 free
    game.state.objects[wurm].summoningSick = false;
  }
  game.advanceUntil(
    (s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers",
  );
  return game;
};

const attacksOf = (game: Game, bot: HeuristicBotController) =>
  bot.declareAttackers({
    state: game.state,
    player: A,
    legalActions: () => game.legalActions(A),
  });

describe("who the bot attacks", () => {
  it("swings at the opponent who cannot punish it, not the first one listed", () => {
    // Bob is guarded, Carol is wide open. Life totals are identical, so the
    // old life-only sort took Bob and lost the creature.
    const game = boardWith([A, B, C], [B]);
    const attacks = attacksOf(game, new HeuristicBotController(A));
    expect(attacks).toHaveLength(1);
    expect(attacks[0].defender).toBe(C);
  });

  it("never sends anything into the guarded opponent, whichever bot decides", () => {
    // Stated as the thing that must not happen rather than as a required
    // attack: v2 may legitimately decline here, since Carol is the *weaker*
    // opponent and tapping the creature costs more than two damage to her
    // gains. What neither may do is feed the creature to Bob's 6/4.
    const game = boardWith([A, B, C], [B]);
    for (const bot of [new HeuristicBotController(A), new EvalBotController(A, undefined, {})]) {
      for (const attack of attacksOf(game, bot)) {
        expect(attack.defender, bot.constructor.name).not.toBe(B);
      }
    }
  });

  it("keeps the creature home when every opponent can kill it", () => {
    const game = boardWith([A, B], [B]);
    expect(attacksOf(game, new HeuristicBotController(A))).toHaveLength(0);
  });

  it("still attacks when nobody can block", () => {
    const game = boardWith([A, B, C], []);
    const attacks = attacksOf(game, new HeuristicBotController(A));
    expect(attacks).toHaveLength(1);
  });
});
