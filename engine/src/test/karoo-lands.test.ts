/**
 * The Karoo / bounce lands, and the `land-you-control` target spec they needed.
 *
 * Two halves worth pinning. The bounce is mandatory and must be able to choose
 * the Karoo *itself* — that is what the printed card does when it is your only
 * land, and a spec that excluded the source would deadlock there. And it must
 * never reach an opponent's land, which is the failure mode of reaching for
 * the plain `land` spec instead.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { isLegalTarget, legalTargets } from "../targeting.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const newGame = (): Game =>
  Game.create({
    seed: 2,
    shuffle: false,
    startingPlayer: A,
    decks: [
      { player: A, cards: Array(40).fill("Forest") },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });

describe("land-you-control", () => {
  it("offers your own lands and never an opponent's", () => {
    const game = newGame();
    const mine = game.debugSpawn("Forest", A);
    const theirs = game.debugSpawn("Forest", B);
    const ref = (id: ObjectId) => ({ kind: "object" as const, object: id });

    expect(isLegalTarget(game.state, game.registry, "land-you-control", ref(mine), A)).toBe(true);
    expect(isLegalTarget(game.state, game.registry, "land-you-control", ref(theirs), A)).toBe(
      false,
    );
    // The plain `land` spec is the one that would wrongly reach across.
    expect(isLegalTarget(game.state, game.registry, "land", ref(theirs), A)).toBe(true);
  });

  it("includes the Karoo itself, its only legal choice when nothing else is out", () => {
    const game = newGame();
    const karoo = game.debugSpawn("Azorius Chancery", A);
    const options = legalTargets(game.state, game.registry, "land-you-control", A).filter(
      (t) => t.kind === "object",
    );
    expect(options.map((t) => (t.kind === "object" ? t.object : null))).toContain(karoo);
  });
});

describe("Karoo lands", () => {
  it("enters tapped and taps for both of its colours at once", () => {
    const game = newGame();
    const karoo = game.debugSpawn("Azorius Chancery", A);
    expect(game.state.objects[karoo].tapped).toBe(true);

    game.state.objects[karoo].tapped = false;
    const options = game
      .manaSources(A)
      .filter((source) => source.id === karoo)
      .flatMap((source) => source.options);
    // One activation yields two mana, not one of a choice of two.
    expect(options.length).toBeGreaterThan(0);
    expect(options.some((o) => o.fixed.length === 2)).toBe(true);
    const produced = options.flatMap((o) => [...o.fixed]);
    expect(produced).toContain("W");
    expect(produced).toContain("U");
  });

  it("bounces a land when it arrives", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    const forest = game.debugSpawn("Forest", A);
    // Played from hand, not spawned onto the battlefield: `debugSpawn` moves
    // the card without emitting `permanent-entered-battlefield`, so an
    // enters-the-battlefield trigger never sees it.
    const karoo = game.debugSpawn("Azorius Chancery", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: karoo });
    game.advanceUntil((s) => s.awaiting !== null || s.zones.shared.stack.length === 0);

    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "choose-targets") {
      game.dispatch({
        type: "choose-targets",
        player: A,
        targets: [{ kind: "object", object: forest }],
      });
    }
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);

    expect(game.state.objects[forest].zone).toBe("hand");
    expect(game.state.objects[karoo].tapped).toBe(true);
  });
});
