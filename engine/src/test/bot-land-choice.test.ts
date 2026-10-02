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

import { EvalBotController } from "../bot/eval-bot.js";
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
const decide = (game: Game, bot: HeuristicBotController = new HeuristicBotController(A, game.registry)) =>
  bot.act(game.controllerView(A));

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

  // Reported from a live game: a bot played an Island with a Mountain in
  // hand, and so couldn't afford any spell in its hand, where the Mountain
  // would have let it cast one. Counting pips alone gets this wrong — the
  // Island adds a colour (blue) the hand wants and the Mountain doesn't — but
  // blue buys nothing this turn, and the second red casts Pyre Charger.
  const strandedRed = (): Game => {
    const game = newGame();
    game.state.zones.perPlayer[A].hand = [];
    game.debugSpawn("Island", A, "hand");
    game.debugSpawn("Mountain", A, "hand");
    game.debugSpawn("Pyre Charger", A, "hand");
    game.debugSpawn("Counterspell", A, "hand");
    game.debugSpawn("Mountain", A);
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    return game;
  };

  for (const [name, bot] of [
    ["v1", (game: Game) => new HeuristicBotController(A, game.registry)],
    // As the live rooms seat it (`server/src/room.ts`), bar the time budget.
    ["v2", (game: Game) => new EvalBotController(A, game.registry)],
  ] as const) {
    it(`${name} plays the land that lets it cast a spell this turn`, () => {
      const game = strandedRed();
      const action = decide(game, bot(game));
      expect(action.type).toBe("play-land");
      if (action.type !== "play-land") return;
      expect(nameOf(game, action.card)).toBe("Mountain");
    });
  }
});
