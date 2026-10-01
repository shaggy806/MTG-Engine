/**
 * Bots crack a fetch land as soon as they can. Evolving Wilds makes no mana,
 * so holding it gains nothing; v2's evaluation scored "a land for a tapped
 * land" as a wash and passed, and its fallback, v1, never weighed it at all
 * (`isFreeFetch`). A land that also taps for mana (Bountiful Landscape) stays
 * a real choice and isn't forced.
 */

import { describe, expect, it } from "vitest";

import { HeuristicBotController } from "../controller.js";
import { EvalBotController } from "../bot/eval-bot.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { PlayerController } from "../controller.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Alice's first main phase with no land drop available (so the fetch isn't
 * queued behind one), `land` and three Forests on her battlefield. */
const setUp = (land: string): { game: Game; land: ObjectId } => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 0 },
    decks: [
      { player: A, cards: Array(40).fill("Forest") },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  const id = game.debugSpawn(land, A);
  game.state.objects[id].tapped = false;
  // Lands beside it: on a bare board v2 happened to crack it anyway, but with
  // mana already there it passed, turn after turn — as in real games.
  for (let i = 0; i < 3; i += 1) game.state.objects[game.debugSpawn("Forest", A)].tapped = false;
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, land: id };
};

const decide = (game: Game, bot: PlayerController) =>
  bot.act({ state: game.state, player: A, legalActions: () => game.legalActions(A) });

const bots: [string, (game: Game) => PlayerController][] = [
  ["v1", (game) => new HeuristicBotController(A, game.registry)],
  ["v2", (game) => new EvalBotController(A, game.registry, { maxSimulations: 8 })],
];

describe("bots and fetch lands", () => {
  for (const [name, make] of bots) {
    it(`${name} cracks Evolving Wilds at once`, () => {
      const { game, land } = setUp("Evolving Wilds");
      const action = decide(game, make(game));
      expect(action).toMatchObject({ type: "activate-ability", source: land });
    });

    it(`${name} isn't forced to crack Bountiful Landscape, which taps for mana`, () => {
      const { game, land } = setUp("Bountiful Landscape");
      const bot = make(game);
      expect((bot as unknown as { isFreeFetch(s: unknown, o: ObjectId, i: number): boolean }).isFreeFetch(game.state, land, 1)).toBe(false);
    });
  }
});
