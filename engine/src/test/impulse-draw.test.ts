/**
 * "Impulse draw" — exile cards face-up and let yourself play them (Dream
 * Pillager, Tectonic Giant, Theater of Horrors).
 *
 * The permission rides on the *card* (`GameObject.impulse`) rather than on a
 * list somewhere, so it survives a `structuredClone`, the source leaving, and
 * anything else that moves state around. Three expiry shapes are covered
 * here, and the distinction between "cast spells from among them" (no lands)
 * and "play them".
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

const makeGame = (aDeck = list([["Lightning Bolt", 10], ["Mountain", 30]])) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: [...aDeck] },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });

const readyMountains = (game: Game, n: number) => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn("Mountain", A, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

const impulseExiled = (game: Game) =>
  game.state.zones.shared.exile.filter((id) => game.state.objects[id].impulse !== undefined);

describe("impulse-exile", () => {
  it("exiles from the top of the library and marks the cards playable", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyMountains(game, 3);

    game.debugApplyEffect(A, {
      kind: "impulse-exile",
      amount: 2,
      duration: "end-of-turn",
    });

    expect(impulseExiled(game).length).toBe(2);
    // Offered as a real cast option, for its normal cost. The opening hand
    // holds Bolts too, so match on the exiled card itself.
    const exiled = impulseExiled(game);
    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && exiled.includes(a.card));
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "cast-spell") return;
    expect(legal.via).toBe("impulse");
  });

  it("lapses at end of turn", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.debugApplyEffect(A, {
      kind: "impulse-exile",
      amount: 1,
      duration: "end-of-turn",
    });
    expect(impulseExiled(game).length).toBe(1);

    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn || s.result.over);
    expect(impulseExiled(game).length).toBe(0);
  });

  it("`castOnly` excludes lands", () => {
    // A deck of nothing but lands: with castOnly nothing becomes playable.
    const game = makeGame(list([["Mountain", 40]]));
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.state.players[A].landsPlayedThisTurn = 0;

    game.debugApplyEffect(A, {
      kind: "impulse-exile",
      amount: 1,
      duration: "end-of-turn",
      castOnly: true,
    });
    const exiled = impulseExiled(game)[0];
    expect(exiled).toBeDefined();
    const lands = game
      .legalActions(A)
      .filter((a) => a.kind === "play-land" && a.card === exiled);
    expect(lands.length).toBe(0);
  });

  it("without `castOnly`, a land may be played from exile", () => {
    const game = makeGame(list([["Mountain", 40]]));
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.state.players[A].landsPlayedThisTurn = 0;

    game.debugApplyEffect(A, {
      kind: "impulse-exile",
      amount: 1,
      duration: "end-of-turn",
    });
    const exiled = impulseExiled(game)[0];
    const lands = game
      .legalActions(A)
      .filter((a) => a.kind === "play-land" && a.card === exiled);
    expect(lands.length).toBe(1);
  });

  it("`choose` grants the permission to only that many", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");

    game.debugApplyEffect(A, {
      kind: "impulse-exile",
      amount: 2,
      duration: "your-next-turn",
      choose: 1,
    });

    // Raises a choice over the two exiled cards.
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind !== "choose-from-zone") return;
    expect(awaiting.eligible.length).toBe(2);

    game.dispatch({ type: "choose-from-zone", player: A, chosen: [awaiting.eligible[0]] });
    // Both stay in exile; only one is playable.
    expect(game.state.zones.shared.exile.length).toBe(2);
    expect(impulseExiled(game).length).toBe(1);
  });

  it("a `your-next-turn` permission survives the opponent's turn", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.debugApplyEffect(A, {
      kind: "impulse-exile",
      amount: 1,
      duration: "your-next-turn",
    });
    expect(impulseExiled(game).length).toBe(1);

    // A's turn ends (one of A's turns counted), then B's whole turn.
    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn + 1 || s.result.over);
    expect(impulseExiled(game).length).toBe(1);
  });

  it("granted on an opponent's turn, a `your-next-turn` permission ends with your next turn", () => {
    // Tectonic Giant targeted by an opponent's spell: "your next turn" is the
    // very next one of yours, not the one after.
    const game = makeGame();
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === B);
    game.debugApplyEffect(A, {
      kind: "impulse-exile",
      amount: 1,
      duration: "your-next-turn",
    });
    expect(impulseExiled(game).length).toBe(1);

    // Survives the rest of Bob's turn and lasts through Alice's turn 3 ...
    game.advanceUntil((s) => s.turn.number === 3 || s.result.over);
    expect(impulseExiled(game).length).toBe(1);
    // ... and is gone once it ends.
    game.advanceUntil((s) => s.turn.number === 4 || s.result.over);
    expect(impulseExiled(game).length).toBe(0);
  });
});

describe("Theater of Horrors — a gated permission", () => {
  it("is unplayable until an opponent has lost life", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyMountains(game, 3);
    const theater = game.debugSpawn("Theater of Horrors", A, "battlefield");

    game.debugApplyEffect(
      A,
      {
        kind: "impulse-exile",
        amount: 1,
        duration: "while-source",
        yourTurnOnly: true,
        gate: { kind: "opponent-lost-life-this-turn" },
      },
      [],
      { source: theater },
    );
    expect(impulseExiled(game).length).toBe(1);

    // Nobody has lost life, so nothing is castable from exile.
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.via === "impulse"),
    ).toBe(false);

    // Drain the opponent and the gate opens.
    game.debugApplyEffect(A, { kind: "lose-life", amount: 1, who: "each-opponent" });
    expect(game.state.players[B].lifeLostThisTurn).toBeGreaterThan(0);
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.via === "impulse"),
    ).toBe(true);
  });
});
