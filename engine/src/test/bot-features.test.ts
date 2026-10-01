/**
 * The evaluation's feature vector — specifically the two nonlinear terms.
 *
 * `bot:audit`'s curve checks are the reason these exist: linear `life` scores
 * losing five at 8 and at 40 identically (ratio 1.00), and linear `library`
 * scores milling ten off a 12-card library the same as off a 52-card one. No
 * weight fixes either, so the bend has to be a feature.
 *
 * The property that matters most here is the *no-op* one. Both terms ship at
 * weight 0, so until they're swept the evaluation has to be exactly what it
 * was before they existed — otherwise every frozen champion and every earlier
 * measurement silently changes meaning.
 */

import { describe, expect, it } from "vitest";

import { CHAMPIONS, DEFAULT_WEIGHTS, FEATURE_KEYS, evaluateState, playerFeatures } from "../bot/index.js";
import { lifeCost } from "../bot/features.js";
import { COMMANDER_RULES, Game } from "../index.js";
import { SAMPLE_DECKS } from "../sample-decks.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const newGame = (): Game =>
  Game.create({
    seed: 11,
    rules: COMMANDER_RULES,
    decks: [
      { player: A, cards: SAMPLE_DECKS[0].cards, commanders: SAMPLE_DECKS[0].commanders },
      { player: B, cards: SAMPLE_DECKS[1].cards, commanders: SAMPLE_DECKS[1].commanders },
    ],
  });

describe("the nonlinear life and library terms", () => {
  it("is zero at a healthy life total and grows as the total falls", () => {
    const game = newGame();
    const at = (life: number): number => {
      game.state.players[A].life = life;
      return playerFeatures(game.state, game.registry, A, true, DEFAULT_WEIGHTS.landCap).lifeDanger;
    };
    expect(at(40)).toBe(0);
    expect(at(15)).toBe(0);
    expect(at(8)).toBe(7);
    expect(at(1)).toBe(14);
  });

  it("makes losing life near death worse than losing the same life at full", () => {
    const game = newGame();
    // The audit's own check, as a test: with the term switched on, the two
    // situations the linear model called identical must now differ.
    const weights = { ...DEFAULT_WEIGHTS, lifeDanger: 1 };
    const scoreAt = (life: number): number => {
      game.state.players[A].life = life;
      return evaluateState(game.state, game.registry, A, weights);
    };
    const highCost = scoreAt(40) - scoreAt(35);
    const lowCost = scoreAt(8) - scoreAt(3);
    expect(lowCost).toBeGreaterThan(highCost);
  });

  it("prices a thin library and a full one differently", () => {
    const game = newGame();
    const weights = { ...DEFAULT_WEIGHTS, libraryDanger: 1 };
    const scoreWith = (cards: number): number => {
      const library = game.state.zones.perPlayer[A].library;
      library.length = cards;
      return evaluateState(game.state, game.registry, A, weights);
    };
    const deepCost = scoreWith(52) - scoreWith(42);
    const thinCost = scoreWith(12) - scoreWith(2);
    expect(thinCost).toBeGreaterThan(deepCost);
  });

  it("changes nothing at all while its weight is zero", () => {
    const game = newGame();
    game.state.players[A].life = 4;
    game.state.zones.perPlayer[A].library.length = 3;
    // `libraryDanger` ships at 0, so a position deep in its danger zone must
    // score exactly as it would with the term stripped out entirely.
    // (`lifeDanger` shipped on 2026-09-26, with `life` halved beside it.)
    const withTerm = evaluateState(game.state, game.registry, A, DEFAULT_WEIGHTS);
    const withoutTerm = evaluateState(game.state, game.registry, A, {
      ...DEFAULT_WEIGHTS,
      libraryDanger: 0,
    });
    expect(DEFAULT_WEIGHTS.libraryDanger).toBe(0);
    expect(withTerm).toBe(withoutTerm);
  });

  it("prices life at half a point above 15 and a point and a half below", () => {
    const game = newGame();
    const scoreAt = (life: number): number => {
      game.state.players[A].life = life;
      return evaluateState(game.state, game.registry, A, DEFAULT_WEIGHTS);
    };
    // Two life at 40 is half a card (`hand` is 2); two life at 10, a card
    // and a half.
    expect(scoreAt(40) - scoreAt(38)).toBeCloseTo(1, 9);
    expect(scoreAt(10) - scoreAt(8)).toBeCloseTo(3, 9);
  });

  it("leaves every frozen champion's behaviour untouched", () => {
    // The gauntlet's whole job is to be a fixed reference. A new feature that
    // moved it would invalidate every regression veto measured against it.
    // Only a vector frozen since `lifeDanger` shipped carries it.
    for (const champion of CHAMPIONS) {
      if (champion.date < "2026-09-26") expect(champion.weights.lifeDanger, champion.id).toBe(0);
      expect(champion.weights.libraryDanger, champion.id).toBe(0);
    }
  });

  it("keeps both terms in the fitted feature vector", () => {
    // `harvest`/`fit` index by this order, so a term missing here is a term no
    // fit can ever speak about.
    expect(FEATURE_KEYS).toContain("lifeDanger");
    expect(FEATURE_KEYS).toContain("libraryDanger");
  });
});

describe("lifeCost", () => {
  it("prices losing life exactly as the evaluation does, bend included", () => {
    const game = newGame();
    const scoreAt = (life: number): number => {
      game.state.players[A].life = life;
      return evaluateState(game.state, game.registry, A, DEFAULT_WEIGHTS);
    };
    for (const [life, damage] of [
      [40, 4],
      [17, 4],
      [10, 4],
    ]) {
      expect(lifeCost(life, damage, DEFAULT_WEIGHTS)).toBeCloseTo(scoreAt(life) - scoreAt(life - damage));
    }
    // Below the line the same four points cost three times as much.
    expect(lifeCost(10, 4, DEFAULT_WEIGHTS)).toBeCloseTo(3 * lifeCost(40, 4, DEFAULT_WEIGHTS));
  });
});
