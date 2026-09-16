/**
 * Phase E of `docs/plans/engine-gaps.md` — "you may pay {cost}. If you do, …"
 * (Nihil Spellbomb, Spit Flame, Dawn of Hope, Mentor of the Meek, Liliana's
 * Devotee).
 *
 * `may` already raised a yes/no `choose-modes` decision; the new part is the
 * cost. Two rules details are pinned down here: the choice is only *offered*
 * when the player could pay, so being broke and declining both land on the
 * same branch, and the mana is actually spent when the choice is answered.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });

const readySwamps = (game: Game, n: number) => {
  const ids = [];
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn("Swamp", A, "battlefield");
    game.state.objects[id].tapped = false;
    ids.push(id);
  }
  return ids;
};

const mayDraw = { kind: "may", prompt: "Pay {B} to draw?", cost: "{B}", effect: { kind: "draw", amount: 1 } } as const;

describe("may with a cost", () => {
  it("raises the choice when the cost is payable", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    readySwamps(game, 1);

    game.debugApplyEffect(A, mayDraw);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    if (awaiting?.kind !== "choose-modes") return;
    expect(awaiting.cost).toBe("{B}");
  });

  it("does not even ask when the cost is unpayable", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    // No untapped lands at all.
    game.debugApplyEffect(A, mayDraw);
    expect(game.state.awaiting).toBeNull();
  });

  it("spends the mana and applies the effect on yes", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const [swamp] = readySwamps(game, 1);
    const handBefore = game.state.zones.perPlayer[A].hand.length;

    game.debugApplyEffect(A, mayDraw);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });

    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore + 1);
    expect(game.state.objects[swamp].tapped).toBe(true);
  });

  it("spends nothing and does nothing on no", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const [swamp] = readySwamps(game, 1);
    const handBefore = game.state.zones.perPlayer[A].hand.length;

    game.debugApplyEffect(A, mayDraw);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });

    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore);
    expect(game.state.objects[swamp].tapped).toBe(false);
  });

  it("takes the `else` branch when it can't be paid", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const lifeBefore = game.state.players[A].life;

    game.debugApplyEffect(A, {
      kind: "may",
      prompt: "Pay {B}?",
      cost: "{B}",
      effect: { kind: "draw", amount: 1 },
      else: { kind: "lose-life", amount: 2 },
    });

    expect(game.state.awaiting).toBeNull();
    expect(game.state.players[A].life).toBe(lifeBefore - 2);
  });
});

describe("Mentor of the Meek", () => {
  it("offers the draw only for a small creature entering", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readySwamps(game, 3);
    game.debugSpawn("Mentor of the Meek", A, "battlefield");

    // Craw Wurm is 6/4 — too big to trigger it.
    game.debugSpawn("Craw Wurm", A, "battlefield", { announceEntry: true });
    game.advanceUntil(
      (s) => s.pendingTriggers.length === 0 && s.priority.holder !== null,
    );
    expect(game.state.awaiting).toBeNull();

    // Grizzly Bears is 2/2 — power 2 or less.
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting !== null || s.result.over);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
  });
});

describe("Liliana's Devotee", () => {
  it("only triggers once a creature has died this turn", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    expect(game.state.creaturesDiedThisTurn).toBe(0);

    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: bear },
    ]);
    expect(game.state.creaturesDiedThisTurn).toBe(1);
  });

  it("forgets on the next turn", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: bear },
    ]);
    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn || s.result.over);
    expect(game.state.creaturesDiedThisTurn).toBe(0);
  });

  it("does not count a noncreature permanent", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const bomb = game.debugSpawn("Nihil Spellbomb", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: bomb },
    ]);
    expect(game.state.creaturesDiedThisTurn).toBe(0);
  });
});
