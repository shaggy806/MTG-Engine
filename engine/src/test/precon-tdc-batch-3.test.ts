/**
 * TDC precons batch 3 — Jeskai Striker: Narset's Reversal, Adaptive Training
 * Post, Voracious Bibliophile, Tempest Technique and Ponder. What they lean
 * on: a copy whose controller may choose new targets (storm's several copies
 * asked one at a time), a delayed "when you next cast" copy, a cast trigger
 * counting the spell's targets, and a standalone shuffle.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (s: GameState): boolean => s.awaiting !== null || quiet(s);

const setUp = (library: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: [...library, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const [land, n] of [["Mountain", 8], ["Island", 8], ["Plains", 6]] as const) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(land, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
  return game;
};

const cast = (game: Game, name: string, targets: TargetRef[] = [], extra: Record<string, unknown> = {}) => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  return card;
};
const creatures = (game: Game, name: string, n: number, who: PlayerId = B): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn(name, who, "battlefield"));
const answerTargets = (game: Game, targets: TargetRef[]): void => {
  game.advanceUntil(settle);
  const awaiting = game.state.awaiting;
  expect(awaiting?.kind).toBe("choose-targets");
  if (awaiting?.kind !== "choose-targets") return;
  expect(awaiting.current).toBeDefined();
  game.dispatch({ type: "choose-targets", player: A, targets });
};
const handSize = (game: Game): number => game.state.zones.perPlayer[A].hand.length;

describe("Narset's Reversal", () => {
  it("copies the spell onto a new target, then returns the original to its owner's hand", () => {
    const game = setUp();
    const [first, second] = creatures(game, "Grizzly Bears", 2);
    const shock = cast(game, "Shock", [obj(first)]);
    cast(game, "Narset's Reversal", [obj(shock)]);
    answerTargets(game, [obj(second)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[shock].zone).toBe("hand");
    expect(game.state.objects[first].zone).toBe("battlefield");
    expect(game.state.objects[second].zone).toBe("graveyard");
  });
});

describe("Adaptive Training Post", () => {
  it("stops at three charge counters", () => {
    const game = setUp();
    const post = game.debugSpawn("Adaptive Training Post", A, "battlefield");
    for (let i = 0; i < 4; i += 1) {
      cast(game, "Shock", [player(B)]);
      game.advanceUntil(quiet);
    }
    expect(game.state.objects[post].counters.charge).toBe(3);
  });

  it("copies the next instant or sorcery cast this turn, with new targets", () => {
    const game = setUp();
    const post = game.debugSpawn("Adaptive Training Post", A, "battlefield");
    game.state.objects[post].counters.charge = 3;
    const [first, second] = creatures(game, "Grizzly Bears", 2);
    game.dispatch({ type: "activate-ability", player: A, source: post, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[post].counters.charge ?? 0).toBe(0);

    cast(game, "Shock", [obj(first)]);
    answerTargets(game, [obj(second)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[first].zone).toBe("graveyard");
    expect(game.state.objects[second].zone).toBe("graveyard");
  });

  it("copies it even after it was countered in response", () => {
    const game = setUp();
    const post = game.debugSpawn("Adaptive Training Post", A, "battlefield");
    game.state.objects[post].counters.charge = 3;
    game.dispatch({ type: "activate-ability", player: A, source: post, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    const shock = cast(game, "Shock", [player(B)]);
    // The delayed trigger is on the stack above Shock; Counterspell goes above
    // both, and the post doesn't copy a second instant this turn.
    cast(game, "Counterspell", [obj(shock)]);
    answerTargets(game, [player(B)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[shock].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(18);
  });
});

describe("Voracious Bibliophile", () => {
  it("draws one card per target of the spell cast", () => {
    const game = setUp();
    game.debugSpawn("Voracious Bibliophile", A, "battlefield");
    const [bear] = creatures(game, "Grizzly Bears", 1);
    let before = handSize(game);
    cast(game, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(before + 1);

    // Two targets: two cards.
    before = handSize(game);
    cast(game, "Prismari Command", [obj(bear), player(A)], { modes: [0, 2] });
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(before + 2);
  });

  it("doesn't trigger on a spell without targets", () => {
    const game = setUp();
    game.debugSpawn("Voracious Bibliophile", A, "battlefield");
    const before = handSize(game);
    cast(game, "Divination");
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(before + 2);
  });
});

describe("Tempest Technique", () => {
  it("storms Aura copies onto other creatures, as tokens, asked one at a time", () => {
    const game = setUp();
    const [c1, c2, c3] = creatures(game, "Grizzly Bears", 3, A);
    cast(game, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    cast(game, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    const tempest = cast(game, "Tempest Technique", [obj(c1)]);
    // Two spells before it: two copies, each asked about in turn.
    answerTargets(game, [obj(c2)]);
    answerTargets(game, [obj(c3)]);
    game.advanceUntil(quiet);

    expect(game.state.objects[tempest].attachedTo).toBe(c1);
    const copies = game.state.zones.shared.battlefield.filter(
      (id) => id !== tempest && game.state.objects[id].cardName === "Tempest Technique",
    );
    expect(copies.map((id) => game.state.objects[id].attachedTo).sort()).toEqual([c2, c3].sort());
    expect(copies.every((id) => game.state.objects[id].isToken)).toBe(true);
    // Three enchantments: each Bears is 5/5.
    expect(game.characteristics(c1).power).toBe(5);
    expect(game.characteristics(c3).toughness).toBe(5);
  });

  it("still storms when the spell itself is countered", () => {
    const game = setUp();
    const [c1, c2] = creatures(game, "Grizzly Bears", 2, A);
    cast(game, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    const tempest = cast(game, "Tempest Technique", [obj(c1)]);
    // Countered while its storm trigger waits above it.
    game.debugSpawn("Island", A, "battlefield");
    const counter = game.debugSpawn("Counterspell", A, "hand");
    const stack = game.state.zones.shared.stack;
    expect(stack.length).toBe(2);
    game.dispatch({ type: "cast-spell", player: A, card: counter, targets: [obj(tempest)] });
    // Counterspell resolves first, then the storm trigger copies the Aura.
    answerTargets(game, [obj(c2)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[tempest].zone).toBe("graveyard");
    const copies = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Tempest Technique",
    );
    expect(copies.map((id) => game.state.objects[id].attachedTo)).toEqual([c2]);
  });
});

describe("Ponder", () => {
  it("puts the top three back in the order chosen, then draws the one put on top", () => {
    const game = setUp();
    const library = game.state.zones.perPlayer[A].library;
    const [p, m, s] = ["Plains", "Mountain", "Swamp"].map((name) => game.debugSpawn(name, A, "library"));
    // On top, in that order.
    const rest = library.filter((id) => ![p, m, s].includes(id));
    library.splice(0, library.length, p, m, s, ...rest);
    cast(game, "Ponder");
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-from-zone");
    // Swamp on top, then Plains, then Mountain.
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [s, p, m] });
    game.advanceUntil(settle);
    // "You may shuffle": declined.
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[s].zone).toBe("hand");
    expect(game.state.zones.perPlayer[A].library.slice(0, 2)).toEqual([p, m]);
  });
});
