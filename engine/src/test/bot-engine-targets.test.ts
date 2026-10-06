/**
 * Engines in v2's target ranking (`aimOffer`'s `rankValue`, `bot/features.ts`'s
 * `engineScore` and `trackRecordOf`): a permanent that keeps drawing its
 * controller cards — by its printed abilities, or by what it has been seen
 * doing (`GameObject.tally`) — ranks above a bigger body, so on a wide board
 * the search gets to it.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { aimOffer } from "../bot/eval-bot.js";
import { engineScore, trackRecordOf } from "../bot/features.js";
import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

/** Alice's main phase on turn 9, with Murder and the mana for it. */
function board(): { game: Game; murder: ObjectId } {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    decks: [
      { player: A, cards: Array(40).fill("Swamp") },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  game.state.turn.number = 9;
  for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
  const murder = game.debugSpawn("Murder", A, "hand");
  return { game, murder };
}

const spawn = (game: Game, name: string): ObjectId =>
  game.debugSpawn(name, B, "battlefield", { summoningSick: false });

/** Murder's target options as v2 ranks them, best first. */
function ranked(game: Game, murder: ObjectId): ObjectId[] {
  const offer = game
    .legalActions(A)
    .find((l): l is Extract<LegalAction, { kind: "cast-spell" }> => l.kind === "cast-spell" && l.card === murder);
  if (offer === undefined) throw new Error("Murder isn't castable");
  const aimed = aimOffer(game.state, registry, A, offer);
  if (aimed.kind !== "cast-spell") throw new Error("not a cast");
  return aimed.targetOptions[0].flatMap((t) => (t.kind === "object" ? [t.object] : []));
}

describe("engines in the target ranking", () => {
  it("ranks a printed draw engine above a bigger body", () => {
    const { game, murder } = board();
    const giant = spawn(game, "Hill Giant");
    const archivist = spawn(game, "Archivist");
    expect(engineScore(game.state, registry, archivist)).toBeGreaterThan(0);
    expect(engineScore(game.state, registry, giant)).toBe(0);
    expect(ranked(game, murder)[0]).toBe(archivist);
  });

  it("ranks a creature by what it has done: cards drawn and damage dealt, a round", () => {
    const { game, murder } = board();
    const baloth = spawn(game, "Rumbling Baloth");
    const bears = spawn(game, "Grizzly Bears");
    expect(ranked(game, murder)[0]).toBe(baloth);
    // Four turns on the battlefield before this one, at two players: two rounds.
    game.state.objects[bears].enteredBattlefieldOnTurn = 5;
    game.state.objects[bears].tally = { lifeTaken: 6, cardsDrawn: 3, thisTurn: { turn: 0, lifeTaken: 0, cardsDrawn: 0 } };
    // 3 cards over 2 rounds, and 6 damage at a card per 4 over 2 rounds.
    expect(trackRecordOf(game.state, registry, bears, 1)).toBeCloseTo(1.5 + 0.75);
    expect(ranked(game, murder)[0]).toBe(bears);
  });

  it("reads only earlier turns: what it does this turn isn't evidence yet", () => {
    const { game } = board();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].enteredBattlefieldOnTurn = 5;
    // All six this turn — as a simulated combat would add them.
    game.state.objects[bears].tally = {
      lifeTaken: 6,
      cardsDrawn: 0,
      thisTurn: { turn: game.state.turn.number, lifeTaken: 6, cardsDrawn: 0 },
    };
    expect(trackRecordOf(game.state, registry, bears, 1)).toBe(0);
  });

  it("counts only draws past what its printed abilities already promise", () => {
    const { game } = board();
    const archivist = spawn(game, "Archivist");
    game.state.objects[archivist].enteredBattlefieldOnTurn = 5;
    // A card a round, which Archivist's {T}: draw a card already says.
    game.state.objects[archivist].tally = { lifeTaken: 0, cardsDrawn: 2, thisTurn: { turn: 0, lifeTaken: 0, cardsDrawn: 0 } };
    expect(trackRecordOf(game.state, registry, archivist, 1)).toBe(0);
  });
});
