/**
 * The fourth precon pass:
 *
 * - `search-library { who: { controllerOfTarget } }` (Path to Exile).
 * - `EffectAmount` `{ devotionTo }` (rule 700.5 — Gray Merchant of Asphodel)
 *   and `{ product }`, which is what lets "life equal to the life lost this
 *   way" multiply devotion by the number of opponents.
 * - `PlayerState.creaturesDiedThisTurn`, the per-player counterpart of the
 *   global one (Liliana's Standard Bearer).
 * - `AbilityCost.discardHand` (Slate of Ancestry).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const makeGame = (players: readonly PlayerId[] = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({
      player,
      cards: Array<string>(40).fill("Swamp"),
    })),
  });

const openWith = (game: Game, n: number) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const kind of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
};

const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

describe("devotion", () => {
  it("counts coloured pips on permanents you control, not their count", () => {
    const game = makeGame();
    openWith(game, 0);
    // Gray Merchant is {3}{B}{B} — two black pips from the Merchant itself.
    game.debugSpawn("Gray Merchant of Asphodel", A, "battlefield");
    // Vengeful Dead is {3}{B} — one more.
    game.debugSpawn("Vengeful Dead", A, "battlefield");
    // An opponent's black permanent is not your devotion.
    game.debugSpawn("Vengeful Dead", B, "battlefield");

    const bLife = game.state.players[B].life;
    const aLife = game.state.players[A].life;
    game.debugApplyEffect(A, {
      kind: "lose-life",
      amount: { devotionTo: "B" },
      who: "each-opponent",
    });
    expect(game.state.players[B].life).toBe(bLife - 3);
    expect(game.state.players[A].life).toBe(aLife);
  });

  it("gains Gray Merchant the total, scaling with the table", () => {
    const three = makeGame([A, B, C]);
    openWith(three, 0);
    const aLife = three.state.players[A].life;
    three.debugSpawn("Gray Merchant of Asphodel", A, "battlefield", {
      announceEntry: true,
    });
    settle(three);

    // Devotion 2 (its own {B}{B}), two opponents: each loses 2, you gain 4.
    expect(three.state.players[B].life).toBe(20 - 2);
    expect(three.state.players[C].life).toBe(20 - 2);
    expect(three.state.players[A].life).toBe(aLife + 4);
  });
});

describe("creatures that died under your control", () => {
  it("counts only your own, and resets each turn", () => {
    const game = makeGame();
    openWith(game, 0);
    const mine = [
      game.debugSpawn("Grizzly Bears", A, "battlefield"),
      game.debugSpawn("Grizzly Bears", A, "battlefield"),
    ];
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

    for (const id of [...mine, theirs]) {
      game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
        { kind: "object", object: id },
      ]);
    }
    settle(game);

    expect(game.state.players[A].creaturesDiedThisTurn).toBe(2);
    expect(game.state.players[B].creaturesDiedThisTurn).toBe(1);
    // Global counts all three.
    expect(game.state.creaturesDiedThisTurn).toBe(3);

    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn || s.result.over);
    expect(game.state.players[A].creaturesDiedThisTurn).toBe(0);
  });

  it("is what Liliana's Standard Bearer draws off", () => {
    const game = makeGame();
    openWith(game, 3);
    for (let i = 0; i < 2; i += 1) {
      const id = game.debugSpawn("Grizzly Bears", A, "battlefield");
      game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
        { kind: "object", object: id },
      ]);
    }
    settle(game);

    const before = game.state.zones.perPlayer[A].hand.length;
    game.debugSpawn("Liliana's Standard Bearer", A, "battlefield", {
      announceEntry: true,
    });
    settle(game);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(before + 2);
  });
});

describe("Path to Exile", () => {
  it("lets the exiled creature's controller do the searching", () => {
    const game = makeGame();
    openWith(game, 1);
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const card = game.debugSpawn("Path to Exile", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "object", object: victim }],
    });
    game.advanceUntil((s) => s.awaiting !== null || s.result.over);

    expect(game.state.objects[victim].zone).toBe("exile");
    // The search decision belongs to B, not to the caster.
    expect(game.state.awaiting?.kind).toBe("choose-from-zone");
    if (game.state.awaiting?.kind !== "choose-from-zone") return;
    expect(game.state.awaiting.player).toBe(B);
  });
});

describe("discarding your hand as a cost", () => {
  it("empties the hand before the draw, so the refill sticks", () => {
    const game = makeGame();
    openWith(game, 5);
    const slate = game.debugSpawn("Slate of Ancestry", A, "battlefield");
    game.state.objects[slate].tapped = false;
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");
    // A hand worth discarding.
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Swamp", A, "hand");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: slate,
      abilityIndex: 0,
      targets: [],
    });
    settle(game);

    // Three creatures out, so exactly three cards — whatever the hand held.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(3);
  });
});
