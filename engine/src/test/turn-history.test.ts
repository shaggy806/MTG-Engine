/**
 * A player's turn so far (`PlayerState.turnHistory`): permanents that entered
 * under their control, creatures that died under it, permanents they
 * sacrificed, permanent cards put into their graveyard ("descended"), damage
 * and combat damage dealt to them, and whether they attacked — read by the
 * `turn-history` condition, the `turnHistory` amount and the new turn stats.
 * Tymna the Weaver's "the number of opponents that were dealt combat damage
 * this turn"; Éowyn, Shieldmaiden's "if another Human entered the battlefield
 * under your control this turn".
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectAmount, EffectSpec } from "../effects.js";
import type { StaticCondition } from "../cards/define.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

/** Tymna the Weaver's second ability. */
const TYMNA = "Test Weaver";
const opponentsHit: EffectAmount = { playersWithTurnStat: "combat-damage-taken", who: "each-opponent" };
/** Éowyn, Shieldmaiden's shape: "At the beginning of combat on your turn, if
 * another Human entered the battlefield under your control this turn, you
 * gain 5 life." */
const EOWYN = "Test Shieldmaiden";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: TYMNA,
      manaCost: "{0}",
      types: ["enchantment"],
      text: TYMNA,
      triggered: [
        {
          trigger: { on: "step-begins", step: "postcombat-main", who: "you" },
          targets: [],
          effect: {
            kind: "may",
            prompt: "Pay X life?",
            costLife: opponentsHit,
            effect: { kind: "draw", amount: opponentsHit },
          },
          resolve: null,
          text: TYMNA,
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: EOWYN,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Human", "Knight"],
      power: 2,
      toughness: 2,
      text: EOWYN,
      triggered: [
        {
          trigger: { on: "step-begins", step: "begin-combat", who: "you" },
          condition: {
            kind: "turn-history",
            what: "entered",
            filter: { subtype: "Human" },
            excludeSelf: true,
          },
          targets: [],
          effect: { kind: "gain-life", amount: 5 },
          resolve: null,
          text: EOWYN,
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: "Test Human",
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Human"],
      power: 1,
      toughness: 1,
      text: "",
    }),
  );

const setUp = (players: readonly PlayerId[] = [A, B]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)])) as Record<
    string,
    ScriptedController
  >;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  controllers[A].chooseModesFn = () => [0];
  return { game, a: controllers[A] };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
/** Apply `effect` as an effect of a permanent `player` controls — a
 * condition is asked from its source's side. The Island is spawned without
 * announcing an entry, so it's in no list. */
const run = (game: Game, effect: EffectSpec, target?: ObjectId, player: PlayerId = A): void => {
  const source = game.debugSpawn("Island", player, "battlefield");
  game.debugApplyEffect(player, effect, target === undefined ? [] : [{ kind: "object", object: target }], {
    source,
  });
  game.advanceUntil(quiet);
};
/** What `amount` comes to for Alice right now. */
const amount = (game: Game, value: EffectAmount): number => {
  const before = game.state.players[A].life;
  run(game, { kind: "gain-life", amount: value });
  const gained = game.state.players[A].life - before;
  game.state.players[A].life = before;
  return gained;
};
/** Whether `condition` holds for Alice right now. */
const holds = (game: Game, condition: StaticCondition): boolean => {
  const before = game.state.players[A].life;
  run(game, { kind: "conditional", condition, then: { kind: "gain-life", amount: 1 } });
  const met = game.state.players[A].life > before;
  game.state.players[A].life = before;
  return met;
};
const attacker = (game: Game, name = "Grizzly Bears"): ObjectId =>
  game.debugSpawn(name, A, "battlefield", { summoningSick: false });

describe("Tymna: opponents dealt combat damage this turn", () => {
  it("pays and draws one for each opponent hit", () => {
    const { game, a } = setUp([A, B, C]);
    game.debugSpawn(TYMNA, A, "battlefield");
    const one = attacker(game);
    const two = attacker(game);
    a.declareAttackersFn = () => [
      { attacker: one, defender: B },
      { attacker: two, defender: C },
    ];
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.players[A].life).toBe(18);
    expect(game.handOf(A).length).toBe(hand + 2);
  });

  it("counts players, not damage", () => {
    const { game, a } = setUp([A, B, C]);
    game.debugSpawn(TYMNA, A, "battlefield");
    const one = attacker(game);
    const two = attacker(game, "Hill Giant");
    a.declareAttackersFn = () => [
      { attacker: one, defender: B },
      { attacker: two, defender: B },
    ];
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.players[A].life).toBe(19);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("Éowyn: another Human entered under your control this turn", () => {
  it("fires with another Human in, even one that has left since", () => {
    const { game } = setUp();
    game.debugSpawn(EOWYN, A, "battlefield", { announceEntry: true });
    const human = game.debugSpawn("Test Human", A, "battlefield", { announceEntry: true });
    run(game, { kind: "destroy", target: 0 }, human);
    game.advanceUntil((s) => s.turn.step === "end");
    expect(game.state.players[A].life).toBe(25);
  });

  it("Éowyn herself doesn't count", () => {
    const { game } = setUp();
    game.debugSpawn(EOWYN, A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.turn.step === "end");
    expect(game.state.players[A].life).toBe(20);
  });
});

describe("the lists and stats", () => {
  it("died: creatures that died under your control, as they last were", () => {
    const { game } = setUp();
    const mine = [attacker(game), attacker(game, "Hill Giant")];
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    for (const id of [...mine, theirs]) run(game, { kind: "destroy", target: 0 }, id);
    expect(amount(game, { turnHistory: "died" })).toBe(2);
    expect(amount(game, { turnHistory: "died", filter: { subtype: "Giant" } })).toBe(1);
    expect(amount(game, { turnHistory: "died", who: "each-opponent" })).toBe(1);
  });

  it("exiled: permanents exiled from under your control", () => {
    const { game } = setUp();
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    run(game, { kind: "exile", target: 0 }, theirs);
    expect(amount(game, { turnHistory: "exiled", who: "each-opponent", filter: { type: "creature" } })).toBe(1);
    expect(amount(game, { turnHistory: "exiled" })).toBe(0);
    expect(amount(game, { turnHistory: "died", who: "each-opponent" })).toBe(0);
  });

  it("sacrificed and descended", () => {
    const { game } = setUp();
    const bears = attacker(game);
    run(game, { kind: "sacrifice-target", target: 0 }, bears);
    expect(amount(game, { turnHistory: "sacrificed" })).toBe(1);
    // The Bears (a permanent card) plus three milled Islands.
    run(game, { kind: "mill", target: "you", amount: 3 });
    expect(amount(game, { turnHistory: "descended" })).toBe(4);
    expect(amount(game, { turnHistory: "descended", filter: { type: "land" } })).toBe(3);
  });

  it("entered, and it all resets as the next turn begins", () => {
    const { game } = setUp();
    game.debugSpawn("Test Human", A, "battlefield", { announceEntry: true });
    expect(holds(game, { kind: "turn-history", what: "entered", filter: { subtype: "Human" } })).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(holds(game, { kind: "turn-history", what: "entered", who: "any-player" })).toBe(false);
    expect(game.state.players[A].turnHistory).toBeUndefined();
  });

  it("raid and damage taken as turn stats", () => {
    const { game, a } = setUp();
    const bears = attacker(game);
    expect(holds(game, { kind: "turn-stat", stat: "attacked", who: "you", atLeast: 1 })).toBe(false);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(holds(game, { kind: "turn-stat", stat: "attacked", who: "you", atLeast: 1 })).toBe(true);
    expect(holds(game, { kind: "turn-stat", stat: "combat-damage-taken", who: "opponent", atLeast: 2 })).toBe(
      true,
    );
    run(game, { kind: "damage", amount: 3, who: "each-opponent" });
    expect(amount(game, { turnStat: "damage-taken", who: "each-opponent" })).toBe(5);
    expect(amount(game, { turnStat: "combat-damage-taken", who: "each-opponent" })).toBe(2);
  });
});
