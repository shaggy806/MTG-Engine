/**
 * Per-turn running totals (`PlayerState.lifeLostThisTurn` /
 * `lifeGainedThisTurn` / `cardsDrawnThisTurn`) and the `turn-stat` condition
 * that reads them.
 *
 * The three were picked by measuring real card text rather than guessed at:
 * about ten cards each for the two life totals and three for draws, across
 * the top 2000 cards and the top 500 commanders. `life-lost` existed before
 * this as a *boolean*, which answered "did an opponent lose life" but not
 * "did a player lose 4 or more" — the clause on Y'shtola, the most-played
 * commander in the format.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[] = []) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Swamp")] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

describe("per-turn running totals", () => {
  it("counts life lost as an amount, not a flag", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    expect(game.state.players[A].lifeLostThisTurn).toBe(0);

    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, who: "you" }, []);
    expect(game.state.players[A].lifeLostThisTurn).toBe(3);
    // Accumulates across separate losses in the same turn — which is the
    // whole reason it isn't a boolean.
    game.debugApplyEffect(A, { kind: "lose-life", amount: 2, who: "you" }, []);
    expect(game.state.players[A].lifeLostThisTurn).toBe(5);
  });

  it("counts life gained, separately from life lost", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 4 }, []);
    game.debugApplyEffect(A, { kind: "lose-life", amount: 1, who: "you" }, []);

    // Gains and losses don't net off: a card asking "did you gain 4 life" is
    // still satisfied after losing 1.
    expect(game.state.players[A].lifeGainedThisTurn).toBe(4);
    expect(game.state.players[A].lifeLostThisTurn).toBe(1);
  });

  it("counts cards drawn, but not a card put into hand another way", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    const before = game.state.players[A].cardsDrawnThisTurn;

    game.debugApplyEffect(A, { kind: "draw", amount: 2 }, []);
    expect(game.state.players[A].cardsDrawnThisTurn).toBe(before + 2);

    // A card put into hand *without* being drawn (a tutor) must not count.
    // `debugSpawn` to hand goes through `moveObject`, the same path a tutor
    // takes, rather than through the draw.
    game.debugSpawn("Swamp", A, "hand");
    expect(game.state.players[A].cardsDrawnThisTurn).toBe(before + 2);
  });

  it("resets every turn", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, who: "you" }, []);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    expect(game.state.players[A].lifeLostThisTurn).toBe(3);

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.players[A].lifeLostThisTurn).toBe(0);
    expect(game.state.players[A].lifeGainedThisTurn).toBe(0);
    expect(game.state.players[A].cardsDrawnThisTurn).toBe(0);
  });
});

describe("Y'shtola, Night's Blessed — the turn-stat condition", () => {
  const spawnYshtola = (game: Game): ObjectId => {
    const id = game.debugSpawn("Y'shtola, Night's Blessed", A, "battlefield");
    game.state.objects[id].summoningSick = false;
    return id;
  };

  it("draws at end of step only once a player has lost 4 or more life", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    spawnYshtola(game);

    // Three isn't enough — the clause is "4 or more".
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, who: "you" }, []);
    let hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "end");
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand);

    // A fourth point of life, in a later turn, arms it.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 4, who: "you" }, []);
    hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "end");
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("counts any player's loss, including its own controller's", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    spawnYshtola(game);

    // "a player", not "an opponent" — an opponent's loss arms it too.
    game.debugApplyEffect(A, { kind: "lose-life", amount: 5, who: "each-opponent" }, []);
    expect(game.state.players[B].lifeLostThisTurn).toBe(5);
    expect(game.state.players[A].lifeLostThisTurn).toBe(0);

    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "end");
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("drains and gains on a noncreature spell of mana value 3 or more", () => {
    const game = mkGame(["Ambition's Cost"]);
    game.advanceUntil(toPrecombat);
    spawnYshtola(game);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Swamp", A, "battlefield");

    // Ambition's Cost is {3}{B} — mana value 4, noncreature.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Ambition's Cost"),
      targets: [],
    });
    game.advanceUntil(quiet);

    expect(game.state.players[B].life).toBe(18); // 2 damage
    // +2 from Y'shtola, −3 from the spell's own cost.
    expect(game.state.players[A].life).toBe(19);
    expect(game.state.players[A].lifeGainedThisTurn).toBe(2);
  });
});
