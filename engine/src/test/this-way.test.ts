/**
 * "This way": what a resolving spell or ability has made players discard,
 * draw, mill or sacrifice so far — Lord Windgrace's "discard a card, then draw
 * a card. If a land card is discarded this way, draw an additional card",
 * Kefka, Court Mage's "draw a card for each card type among cards discarded
 * this way", Mr. Foxglove's "if you didn't draw cards this way". Read off the
 * resolution's own events (`GameState.resolutionSince`), so a step that waited
 * on a player's choice still counts.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Lord Windgrace's +2. */
const windgrace: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "discard", target: "you", amount: 1 },
    { kind: "draw", amount: 1 },
    {
      kind: "conditional",
      condition: { kind: "this-way", what: "discarded", filter: { type: "land" } },
      then: { kind: "draw", amount: 1 },
    },
  ],
};

const RUMMAGE = "Test Rummage";
const registry = createDefaultRegistry().register(
  defineCard({
    name: RUMMAGE,
    manaCost: "{0}",
    types: ["sorcery"],
    text: "Discard a card, then draw a card. If a land card is discarded this way, draw an additional card.",
    effect: windgrace,
  }),
);

const islands = (n = 40): string[] => Array<string>(n).fill("Island");
/** Opening hands are the top of the library, and a scripted player discards
 * from the front of their hand — so a deck's first card is what they give up. */
const setUp = (aDeck: readonly string[] = islands(), bDeck: readonly string[] = islands()) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aDeck] },
      { player: B, cards: [...bDeck] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0 &&
  s.priority.holder !== null;
const run = (game: Game, effect: EffectSpec, x?: number): void => {
  game.debugApplyEffect(A, effect, [], x === undefined ? {} : { x });
  game.advanceUntil(quiet);
};
const hand = (game: Game, player: PlayerId = A): number => game.handOf(player).length;

describe("discarded this way", () => {
  it("Lord Windgrace: a land discarded draws an extra card", () => {
    const game = setUp();
    const before = hand(game);
    run(game, windgrace);
    expect(hand(game)).toBe(before + 1);
  });

  it("…and a nonland doesn't", () => {
    const game = setUp(["Grizzly Bears", ...islands(39)]);
    const before = hand(game);
    run(game, windgrace);
    expect(hand(game)).toBe(before);
    expect(game.state.zones.perPlayer[A].graveyard.map((id) => game.state.objects[id].cardName)).toEqual([
      "Grizzly Bears",
    ]);
  });

  it("works the same resolving from the stack", () => {
    const game = setUp();
    const rummage = game.debugSpawn(RUMMAGE, A, "hand");
    const before = hand(game);
    game.dispatch({ type: "cast-spell", player: A, card: rummage, targets: [] });
    game.advanceUntil(quiet);
    // The Rummage left the hand; then -1 +2.
    expect(hand(game)).toBe(before - 1 + 1);
    expect(game.state.resolutionSince).toBeUndefined();
  });

  it("Kefka: a card for each card type among cards every player discarded", () => {
    const game = setUp(["Darksteel Myr", ...islands(39)], islands());
    const before = hand(game);
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "discard", target: "each-player", amount: 1 },
        { kind: "draw", amount: { thisWay: "discarded", cardTypes: true } },
      ],
    });
    // Artifact, creature (the Myr) and land (Bob's Island): three.
    expect(hand(game)).toBe(before - 1 + 3);
  });

  it("`who` counts only the scope's cards", () => {
    const game = setUp();
    const before = hand(game);
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "discard", target: "each-player", amount: 1 },
        { kind: "draw", amount: { thisWay: "discarded", who: "each-opponent" } },
      ],
    });
    expect(hand(game)).toBe(before - 1 + 1);
  });
});

describe("drawn, milled and sacrificed this way", () => {
  /** Mr. Foxglove's shape: "draw X. If you didn't draw cards this way, …". */
  const foxglove: EffectSpec = {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: "x" },
      {
        kind: "conditional",
        condition: { kind: "this-way", what: "drawn", who: "you", atMost: 0 },
        then: { kind: "gain-life", amount: 5 },
      },
    ],
  };

  it("'if you didn't draw cards this way'", () => {
    const game = setUp();
    run(game, foxglove, 0);
    expect(game.state.players[A].life).toBe(25);
    run(game, foxglove, 2);
    expect(game.state.players[A].life).toBe(25);
  });

  it("a draw earlier in the turn isn't this resolution's", () => {
    const game = setUp();
    run(game, { kind: "draw", amount: 3 });
    run(game, foxglove, 0);
    expect(game.state.players[A].life).toBe(25);
  });

  it("milled: a card for each land milled this way", () => {
    const game = setUp([...islands(10), "Grizzly Bears", "Grizzly Bears", ...islands(28)]);
    const before = hand(game);
    // Alice's library now starts with two Islands, then the Bears.
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "mill", target: "you", amount: 4 },
        { kind: "draw", amount: { thisWay: "milled", filter: { type: "land" } } },
      ],
    });
    expect(hand(game)).toBe(before + 2);
  });

  it("sacrificed: read as it last existed", () => {
    const game = setUp();
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
        { kind: "gain-life", amount: { thisWay: "sacrificed", filter: { type: "creature" } } },
      ],
    });
    expect(game.state.players[A].life).toBe(21);
  });
});
