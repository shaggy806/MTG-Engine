/**
 * Coin flips (rule 705), on the game's seeded random stream: "flip a coin; if
 * you win the flip, …; if you lose, …", "flip a coin until you lose a flip"
 * (Okaun, Eye of Chaos; Zndrsplt, Eye of Wisdom), and "whenever a player
 * wins a coin flip" — once per flip won.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Zndrsplt's "whenever a player wins a coin flip, draw a card". */
const ZNDRSPLT = "Test Eye of Wisdom";
const registry = createDefaultRegistry().register(
  defineCard({
    name: ZNDRSPLT,
    manaCost: "{0}",
    types: ["enchantment"],
    text: ZNDRSPLT,
    triggered: [
      {
        trigger: { on: "wins-coin-flip", who: "any" },
        targets: [],
        effect: { kind: "draw", amount: 1 },
        resolve: null,
        text: ZNDRSPLT,
      },
    ],
  }),
);

const setUp = (seed: number) => {
  const game = Game.create({
    seed,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(60).fill("Island") },
      { player: B, cards: Array<string>(60).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const run = (game: Game, effect: EffectSpec): void => {
  const source = game.debugSpawn("Island", A, "battlefield");
  game.debugApplyEffect(A, effect, [], { source });
  game.advanceUntil(quiet);
};
const flips = (game: Game) => game.eventsOfType("coin-flipped");

describe("flip a coin", () => {
  it("the branch for how it landed applies", () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const game = setUp(seed);
      run(game, { kind: "flip-coin", won: { kind: "gain-life", amount: 1 }, lost: { kind: "lose-life", amount: 1 } });
      const [flip] = flips(game);
      expect(flips(game)).toHaveLength(1);
      expect(game.state.players[A].life).toBe(flip.won ? 21 : 19);
    }
  });

  it("both outcomes happen over a handful of seeds, and a seed replays the same", () => {
    const outcomes = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => {
      const game = setUp(seed);
      run(game, { kind: "flip-coin" });
      return flips(game)[0].won;
    });
    expect(outcomes).toContain(true);
    expect(outcomes).toContain(false);
    const again = setUp(3);
    run(again, { kind: "flip-coin" });
    expect(flips(again)[0].won).toBe(outcomes[2]);
  });

  it("until you lose: flips end on the first loss, and each win triggers", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const game = setUp(seed);
      game.debugSpawn(ZNDRSPLT, A, "battlefield");
      const hand = game.handOf(A).length;
      run(game, { kind: "flip-coin", untilLose: true });
      const all = flips(game);
      expect(all.at(-1)?.won).toBe(false);
      expect(all.slice(0, -1).every((f) => f.won)).toBe(true);
      expect(game.handOf(A).length).toBe(hand + all.length - 1);
    }
  });
});
