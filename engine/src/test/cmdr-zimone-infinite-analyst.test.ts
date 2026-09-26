/**
 * Zimone, Infinite Analyst — {1}{G}{U} legendary 0/4 Human Wizard.
 *
 *   The first spell you cast with {X} in its mana cost each turn costs {1}
 *   less to cast for each +1/+1 counter on Zimone.
 *   Whenever you cast your first spell with {X} in its mana cost each turn,
 *   put two +1/+1 counters on Zimone.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();
const ZIMONE = "Zimone, Infinite Analyst";

const makeGame = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const islands = (game: Game, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn("Island", A, "battlefield");
};
type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;
/** The most X Alice can pay for this Mind Spring ({X}{U}{U}) right now. */
const maxX = (game: Game, card: ObjectId): number | undefined =>
  game.legalActions(A).find((o): o is CastOffer => o.kind === "cast-spell" && o.card === card)?.xCost?.maxX;
const castMindSpring = (game: Game, x: number): ObjectId => {
  const card = game.debugSpawn("Mind Spring", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, xValue: x });
  game.advanceUntil(quiet);
  return card;
};
const counters = (game: Game, zimone: ObjectId): number => game.state.objects[zimone].counters["+1/+1"] ?? 0;

describe("Zimone, Infinite Analyst", () => {
  it("your first {X} spell each turn puts two +1/+1 counters on her; the second doesn't", () => {
    const game = makeGame();
    const zimone = game.debugSpawn(ZIMONE, A, "battlefield");
    islands(game, 4);
    castMindSpring(game, 0);
    expect(counters(game, zimone)).toBe(2);
    castMindSpring(game, 0);
    expect(counters(game, zimone)).toBe(2);
  });

  it("a spell without {X} doesn't count as the first", () => {
    const game = makeGame();
    const zimone = game.debugSpawn(ZIMONE, A, "battlefield");
    islands(game, 3);
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Opt", A, "hand") });
    game.advanceUntil(quiet);
    expect(counters(game, zimone)).toBe(0);
    castMindSpring(game, 0);
    expect(counters(game, zimone)).toBe(2);
  });

  it("the first {X} spell costs {1} less per counter, off its X too; the next pays in full", () => {
    const game = makeGame();
    const zimone = game.debugSpawn(ZIMONE, A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 }, [], {
      source: zimone,
    });
    islands(game, 3);
    // Three Islands: {U}{U} and one more, plus the two-counter discount.
    const first = game.debugSpawn("Mind Spring", A, "hand");
    expect(maxX(game, first)).toBe(3);
    game.dispatch({ type: "cast-spell", player: A, card: first, xValue: 3 });
    game.advanceUntil(quiet);
    expect(game.state.objects[first].zone).toBe("graveyard");
    expect(counters(game, zimone)).toBe(4);
    // A second one this turn pays in full: five fresh Islands buy X = 3.
    islands(game, 5);
    expect(maxX(game, game.debugSpawn("Mind Spring", A, "hand"))).toBe(3);
  });

  it("an {X} spell cast before she arrived used the discount up", () => {
    const game = makeGame();
    islands(game, 2);
    castMindSpring(game, 0);
    const zimone = game.debugSpawn(ZIMONE, A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 }, [], {
      source: zimone,
    });
    islands(game, 3);
    expect(maxX(game, game.debugSpawn("Mind Spring", A, "hand"))).toBe(1);
  });
});
