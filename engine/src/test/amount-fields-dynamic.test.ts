/**
 * Fields that were fixed numbers and now take an `EffectAmount`, read as the
 * effect applies: scry and surveil N, look-and-choose's max, a modal's max
 * modes, and the counters a permanent enters with. (animate's P/T and an
 * X/X token have their own tests — Zur, Eternal Schemer and Rootha,
 * Mastering the Moment.)
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectAmount } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "This enters with a +1/+1 counter on it for each other Ooze you
 * control" — Aeve, Progenitor Ooze's clause, alone. */
const TEST_OOZE = defineCard({
  name: "Test Counting Ooze",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ooze"],
  power: 0,
  toughness: 0,
  text: "This creature enters with a +1/+1 counter on it for each other Ooze you control.",
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "+1/+1", amount: { countOf: { subtype: "Ooze", controlledBy: "you" } } },
      },
      text: "This creature enters with a +1/+1 counter on it for each other Ooze you control.",
    },
  ],
});

const makeGame = () => {
  const registry = createDefaultRegistry();
  registry.register(TEST_OOZE);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  // Three lands: what every live amount below counts.
  for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
  return game;
};

const LANDS: EffectAmount = { countOf: { type: "land", controlledBy: "you" } };

describe("amount fields read as the effect applies", () => {
  it("scry and surveil X", () => {
    const game = makeGame();
    game.debugApplyEffect(A, { kind: "scry", amount: LANDS });
    const scry = game.state.awaiting;
    expect(scry?.kind === "scry" ? [scry.mode, scry.cards.length] : null).toEqual(["scry", 3]);

    const game2 = makeGame();
    game2.debugApplyEffect(A, { kind: "surveil", amount: LANDS });
    const surveil = game2.state.awaiting;
    expect(surveil?.kind === "scry" ? [surveil.mode, surveil.cards.length] : null).toEqual(["surveil", 3]);
  });

  it("look-and-choose's max", () => {
    const game = makeGame();
    game.debugApplyEffect(A, {
      kind: "look-and-choose",
      zone: "library",
      count: 6,
      min: 0,
      max: LANDS,
      destination: "hand",
      leftover: "bottom",
    });
    const choose = game.state.awaiting;
    expect(choose?.kind === "choose-from-zone" ? [choose.min, choose.max] : null).toEqual([0, 3]);
  });

  it("a modal's max modes", () => {
    const game = makeGame();
    const mode = (text: string) => ({ text, effect: { kind: "gain-life" as const, amount: 1 } });
    game.debugApplyEffect(A, {
      kind: "modal",
      minModes: 1,
      maxModes: { countOf: { type: "land", controlledBy: "you", tapped: false }, times: 1 },
      modes: [mode("one"), mode("two"), mode("three"), mode("four")],
    });
    const modes = game.state.awaiting;
    expect(modes?.kind === "choose-modes" ? [modes.minModes, modes.maxModes] : null).toEqual([1, 3]);
  });

  it("the counters a permanent enters with, never counting itself", () => {
    const game = makeGame();
    game.debugSpawn("Test Counting Ooze", A, "battlefield");
    game.debugSpawn("Test Counting Ooze", A, "battlefield");
    const third = game.debugSpawn("Test Counting Ooze", A, "battlefield");
    game.debugSpawn("Test Counting Ooze", B, "battlefield");
    expect(game.state.objects[third].counters["+1/+1"]).toBe(2);
  });
});
