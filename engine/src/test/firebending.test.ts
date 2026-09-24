/**
 * Firebending N (the `firebending` helper): "Whenever this creature attacks,
 * add N {R}. This mana lasts until end of combat." The mana stays through
 * the combat phase's steps and is lost as the phase ends; "firebending X,
 * where X is its power" reads the power as the trigger resolves.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { firebending } from "../cards/helpers.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { Step } from "../turn.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const bender = (name: string, power: number, ability: ReturnType<typeof firebending>) =>
  defineCard({
    name,
    manaCost: "{0}",
    colors: ["R"],
    types: ["creature"],
    subtypes: ["Human"],
    power,
    toughness: 2,
    text: ability.text,
    triggered: [ability],
  });

const FIRE = "Test Firebender";
const LORD = "Test Fire Lord Bender";
const registry = createDefaultRegistry()
  .register(bender(FIRE, 2, firebending(2)))
  .register(bender(LORD, 3, firebending({ powerOf: "source" })));

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

const red = (game: Game): number =>
  game.state.players[A].manaPool.filter((unit) => unit.type === "R").length;
/** At `step`, with the attack declared and its trigger resolved. */
const at = (game: Game, step: Step): void => {
  game.advanceUntil(
    (s) =>
      s.turn.step === step &&
      s.awaiting === null &&
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      game.eventsOfType("ability-resolved").length > 0,
  );
};

describe("firebending", () => {
  it("adds its {R} as it attacks, and the mana lasts through combat only", () => {
    const { game, a } = setUp();
    const creature = game.debugSpawn(FIRE, A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: creature, defender: B }];
    at(game, "declare-attackers");
    expect(red(game)).toBe(2);
    at(game, "combat-damage");
    expect(red(game)).toBe(2);
    at(game, "end-combat");
    expect(red(game)).toBe(2);
    at(game, "postcombat-main");
    expect(red(game)).toBe(0);
  });

  it("firebending X reads the creature's power", () => {
    const { game, a } = setUp();
    const creature = game.debugSpawn(LORD, A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: creature, defender: B }];
    at(game, "declare-attackers");
    expect(red(game)).toBe(3);
  });
});
