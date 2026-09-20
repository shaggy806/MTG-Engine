/**
 * Which land the bot plays when it has a choice.
 *
 * Reported from a real game: a Selesnya bot laid two Plains and then could not
 * cast its own {G}{W} commander on turn two. The cause was that the land drop
 * was `options.find(...)` — the first land the enumeration listed — with no
 * notion of colour at all.
 *
 * Nothing downstream rescued it: v2 scores each land drop by simulating it,
 * but the evaluation has no colour-availability term, so every land scores
 * alike and the tie-break picks the first again. So this is v1's decision to
 * make, and v2/v3 inherit it.
 */

import { describe, expect, it } from "vitest";

import { HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const newGame = (): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array(40).fill("Swamp") },
      { player: B, cards: Array(40).fill("Swamp") },
    ],
  });

/** What the bot chooses to do right now. */
const decide = (game: Game) => {
  const bot = new HeuristicBotController(A, game.registry);
  return bot.act({
    state: game.state,
    player: A,
    legalActions: () => game.legalActions(A),
  });
};

const nameOf = (game: Game, id: ObjectId): string => game.state.objects[id].cardName;

describe("the bot's land choice", () => {
  it("plays the land whose colour its hand actually needs", () => {
    const game = newGame();
    // Hand: two Plains and a Forest, plus a {G}{W} spell to cast.
    game.debugSpawn("Plains", A, "hand");
    game.debugSpawn("Plains", A, "hand");
    game.debugSpawn("Forest", A, "hand");
    game.debugSpawn("Emmara, Soul of the Accord", A, "hand");
    // A Plains is already down, so white is covered and green is not.
    game.debugSpawn("Plains", A);
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);

    const action = decide(game);
    expect(action.type).toBe("play-land");
    if (action.type !== "play-land") return;
    // The bug laid a second Plains here, stranding the {G}{W} commander.
    expect(nameOf(game, action.card)).toBe("Forest");
  });

  it("does not chase a colour nothing in hand wants", () => {
    const game = newGame();
    game.debugSpawn("Island", A, "hand");
    game.debugSpawn("Forest", A, "hand");
    // Only a green card in hand, so the Island is worth nothing to it.
    game.debugSpawn("Llanowar Elves", A, "hand");
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);

    const action = decide(game);
    expect(action.type).toBe("play-land");
    if (action.type !== "play-land") return;
    expect(nameOf(game, action.card)).toBe("Forest");
  });
});
