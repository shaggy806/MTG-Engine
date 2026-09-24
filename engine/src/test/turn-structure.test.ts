/**
 * The turn's structure: an additional combat phase straight after the one
 * under way ("after this phase, there is an additional combat phase" —
 * Karlach, Fury of Avernus; Anzrag), optionally "followed by an additional
 * main phase" (Najeela, the Blade-Blossom); the per-turn count of combat and
 * main phases behind the `turn-structure` condition ("if it's the first
 * combat phase of the turn"); and a CDA that defines only its power (Eluge,
 * the Shoreless Sea's power over a printed 5 toughness).
 */

import { describe, expect, it } from "vitest";

import type { StaticCondition } from "../cards/define.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const extraCombat = (withMain: boolean): EffectSpec => ({
  kind: "sequence",
  effects: [
    { kind: "untap-all", filter: { type: "creature", controlledBy: "you", attacking: true } },
    { kind: "additional-combat", afterThisPhase: true, withMain },
  ],
});
const firstCombat: StaticCondition = { kind: "turn-structure", combatPhase: 1 };
const attackWatcher = (name: string, withMain: boolean) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    triggered: [
      {
        trigger: { on: "attack-with", who: "you", atLeast: 1 },
        condition: firstCombat,
        targets: [],
        effect: extraCombat(withMain),
        resolve: null,
        text: name,
      },
    ],
  });

/** Karlach's shape: "Whenever you attack, if it's the first combat phase of
 * the turn, untap all attacking creatures. After this phase, there is an
 * additional combat phase." */
const KARLACH = "Test Fury";
/** Najeela's: "…an additional combat phase followed by an additional main
 * phase." */
const NAJEELA = "Test Blade-Blossom";
/** Eluge's shape: power equal to the number of Islands you control, printed
 * toughness 5. */
const ELUGE = "Test Shoreless";

const registry = createDefaultRegistry()
  .register(attackWatcher(KARLACH, false))
  .register(attackWatcher(NAJEELA, true))
  .register(
    defineCard({
      name: ELUGE,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Elemental"],
      power: 0,
      toughness: 5,
      text: ELUGE,
      static: [
        {
          affects: { scope: "self" },
          setBasePtFromCount: {
            countOf: { countOf: { subtype: "Island", controlledBy: "you" } },
            plusPower: 0,
            plusToughness: 0,
            only: "power",
          },
          text: "Its power is equal to the number of Islands you control.",
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

const toEndStep = (game: Game) => game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end");
const began = (game: Game, step: string): number =>
  game.eventsOfType("step-began").filter((e) => e.step === step).length;
const attackEveryCombat = (a: ScriptedController, attacker: ObjectId) => {
  a.declareAttackersFn = () => [{ attacker, defender: B }];
};

describe("an additional combat phase after this one", () => {
  it("Karlach: one extra combat, straight after the first, and not again from the second", () => {
    const { game, a } = setUp();
    game.debugSpawn(KARLACH, A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield", { summoningSick: false });
    attackEveryCombat(a, giant);
    toEndStep(game);
    expect(began(game, "begin-combat")).toBe(2);
    expect(began(game, "postcombat-main")).toBe(1);
    // It untapped after the first attack, so it attacked twice.
    expect(game.state.players[B].life).toBe(14);
    expect(game.eventsOfType("additional-combat-phase")).toHaveLength(1);
  });

  it("Najeela: …followed by an additional main phase", () => {
    const { game, a } = setUp();
    game.debugSpawn(NAJEELA, A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield", { summoningSick: false });
    attackEveryCombat(a, giant);
    toEndStep(game);
    expect(began(game, "begin-combat")).toBe(2);
    expect(began(game, "postcombat-main")).toBe(2);
    expect(game.state.players[B].life).toBe(14);
  });

  it("the phase counts reset as the next turn begins", () => {
    const { game, a } = setUp();
    game.debugSpawn(KARLACH, A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield", { summoningSick: false });
    attackEveryCombat(a, giant);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.state.turn.combatPhases ?? 0).toBe(0);
    expect(game.state.turn.mainPhases).toBe(1);
  });
});

describe("the turn-structure condition", () => {
  const holds = (game: Game, condition: StaticCondition): boolean => {
    const source = game.debugSpawn("Island", A, "battlefield");
    const before = game.state.players[A].life;
    game.debugApplyEffect(A, { kind: "conditional", condition, then: { kind: "gain-life", amount: 1 } }, [], {
      source,
    });
    const met = game.state.players[A].life > before;
    game.state.players[A].life = before;
    return met;
  };

  it("steps, combat and the Nth main phase", () => {
    const { game } = setUp();
    expect(holds(game, { kind: "turn-structure", steps: ["precombat-main"] })).toBe(true);
    expect(holds(game, { kind: "turn-structure", duringCombat: true })).toBe(false);
    expect(holds(game, { kind: "turn-structure", mainPhase: 1 })).toBe(true);
    expect(holds(game, { kind: "turn-structure", mainPhase: 2 })).toBe(false);
    game.advanceUntil((s) => s.turn.step === "begin-combat");
    expect(holds(game, { kind: "turn-structure", duringCombat: true, combatPhase: 1 })).toBe(true);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(holds(game, { kind: "turn-structure", mainPhase: 2 })).toBe(true);
  });
});

describe("a power-only CDA", () => {
  it("counts the power and keeps the printed toughness", () => {
    const { game } = setUp();
    const eluge = game.debugSpawn(ELUGE, A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    expect(game.characteristics(eluge).power).toBe(2);
    expect(game.characteristics(eluge).toughness).toBe(5);
  });
});
