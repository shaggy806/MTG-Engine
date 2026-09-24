/**
 * `CardFilter`'s history-this-turn clauses: `enteredThisTurn` and
 * `attackedThisTurn` — Kratos, God of War's "the number of creatures that
 * player controls that didn't attack this turn". "Attacked this turn" is the
 * turn's own: it resets as every turn begins (not only in its controller's
 * untap step), and a permanent that changes zones is a new object that never
 * attacked. A permanent that has left is asked as it last was.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectAmount } from "../effects.js";
import type { CardFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "Whenever a creature that attacked this turn dies, you gain 1 life." */
const WATCHER = "Test Veteran Watcher";
const registry = createDefaultRegistry().register(
  defineCard({
    name: WATCHER,
    manaCost: "{0}",
    types: ["enchantment"],
    text: WATCHER,
    triggered: [
      {
        trigger: { on: "dies", who: "any", filter: { type: "creature", attackedThisTurn: true } },
        targets: [],
        effect: { kind: "gain-life", amount: 1 },
        resolve: null,
        text: WATCHER,
      },
    ],
  }),
);

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** Alice's count of battlefield permanents matching `filter`, as an amount. */
const count = (game: Game, filter: CardFilter): number => {
  const before = game.state.players[A].life;
  const amount: EffectAmount = { countOf: filter };
  game.debugApplyEffect(A, { kind: "gain-life", amount });
  game.advanceUntil(quiet);
  const gained = game.state.players[A].life - before;
  game.state.players[A].life = before;
  return gained;
};
const creature = (game: Game, name = "Grizzly Bears"): ObjectId =>
  game.debugSpawn(name, A, "battlefield", { summoningSick: false });
const didntAttack: CardFilter = { type: "creature", controlledBy: "you", attackedThisTurn: false };

describe("attackedThisTurn", () => {
  it("counts the creatures that didn't attack", () => {
    const { game, a } = setUp();
    const attacker = creature(game);
    creature(game);
    creature(game);
    a.declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(count(game, didntAttack)).toBe(2);
    expect(count(game, { type: "creature", attackedThisTurn: true })).toBe(1);
  });

  it("is this turn's: an opponent's turn starts everyone afresh", () => {
    const { game, a } = setUp();
    const attacker = creature(game);
    a.declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(count(game, { type: "creature", attackedThisTurn: true })).toBe(0);
  });

  it("a permanent that changes zones never attacked", () => {
    const { game, a } = setUp();
    const attacker = creature(game);
    a.declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: attacker }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[attacker].zone).toBe("battlefield");
    expect(count(game, { type: "creature", attackedThisTurn: true })).toBe(0);
  });

  it("a creature that has died is asked as it last was", () => {
    const { game, a } = setUp();
    game.debugSpawn(WATCHER, A, "battlefield");
    const attacker = creature(game);
    const homebody = creature(game);
    a.declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    const life = game.state.players[A].life;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: homebody }]);
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(life);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: attacker }]);
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(life + 1);
  });
});

describe("enteredThisTurn", () => {
  it("is true the turn it entered, and not after", () => {
    const { game } = setUp();
    creature(game);
    expect(count(game, { type: "creature", enteredThisTurn: true })).toBe(1);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(count(game, { type: "creature", enteredThisTurn: true })).toBe(0);
    expect(count(game, { type: "creature", enteredThisTurn: false })).toBe(1);
  });
});
