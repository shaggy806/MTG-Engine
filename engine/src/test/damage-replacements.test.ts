/**
 * `would-deal-damage` replacements beyond Dictate of the Twin Gods' global
 * doubling: scoped by source ("a creature you control that entered this
 * turn" — Neriv; "a Wizard you control" — Kuja) and by recipient ("an
 * opponent or a permanent an opponent controls" — Torbran), "+2" (`plus`),
 * and prevention with a follow-up ("prevent that damage and each opponent
 * mills that many cards" — The Mindskinner; "prevent that damage and put
 * that many +1/+1 counters on it").
 */

import { describe, expect, it } from "vitest";

import type { StaticAbility } from "../cards/define.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const enchantment = (name: string, replacement: StaticAbility["replacement"]) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    static: [{ affects: { scope: "self" }, replacement, text: name }],
  });

const NERIV = "Test Storm Heart";
const TORBRAN = "Test Thane";
const MINDSKINNER = "Test Mindskinner";
const SPONGE = "Test Sponge";

const registry = createDefaultRegistry()
  .register(
    enchantment(NERIV, {
      event: "would-deal-damage",
      multiplier: 2,
      source: { type: "creature", controlledBy: "you", enteredThisTurn: true },
    }),
  )
  .register(
    enchantment(TORBRAN, {
      event: "would-deal-damage",
      plus: 2,
      source: { colors: ["R"], controlledBy: "you" },
      to: "opponent-side",
    }),
  )
  .register(
    enchantment(MINDSKINNER, {
      event: "would-deal-damage",
      prevent: true,
      source: { controlledBy: "you" },
      to: "opponent",
      then: { kind: "mill", target: "each-opponent", amount: "x" },
    }),
  )
  .register(
    defineCard({
      name: SPONGE,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Symbiote"],
      power: 2,
      toughness: 2,
      text: SPONGE,
      static: [
        {
          affects: { scope: "self" },
          replacement: {
            event: "would-deal-damage",
            prevent: true,
            to: "self",
            then: { kind: "add-counter", target: "source", counter: "+1/+1", amount: "x" },
          },
          text: "If damage would be dealt to it, prevent that damage and put that many +1/+1 counters on it.",
        },
      ],
    }),
  );

const setUp = () => {
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
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** `source` deals `amount` damage to `to`. */
const hit = (game: Game, source: ObjectId, to: PlayerId | ObjectId, amount: number): void => {
  const target =
    game.state.players[to as PlayerId] !== undefined
      ? ({ kind: "player", player: to as PlayerId } as const)
      : ({ kind: "object", object: to as ObjectId } as const);
  const controller = game.state.objects[source].controller;
  game.debugApplyEffect(controller, { kind: "damage", amount, target: 0 }, [target], { source });
  game.advanceUntil(quiet);
};
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

describe("scoped by source", () => {
  it("Neriv: a creature you control that entered this turn deals double", () => {
    const game = setUp();
    game.debugSpawn(NERIV, A, "battlefield");
    const fresh = game.debugSpawn("Grizzly Bears", A, "battlefield");
    hit(game, fresh, B, 2);
    expect(life(game, B)).toBe(16);
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    hit(game, theirs, A, 2);
    expect(life(game, A)).toBe(18);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    hit(game, fresh, B, 2);
    expect(life(game, B)).toBe(14);
  });
});

describe("scoped by recipient, and +N", () => {
  it("Torbran: a red source you control, to an opponent or their permanents", () => {
    const game = setUp();
    game.debugSpawn(TORBRAN, A, "battlefield");
    const goblin = game.debugSpawn("Raging Goblin", A, "battlefield");
    hit(game, goblin, B, 1);
    expect(life(game, B)).toBe(17);
    const theirs = game.debugSpawn("Hill Giant", B, "battlefield");
    hit(game, goblin, theirs, 1);
    expect(game.state.objects[theirs].damageMarked).toBe(3);
    // Your own creature, and a non-red source, are left alone.
    const mine = game.debugSpawn("Hill Giant", A, "battlefield");
    hit(game, goblin, mine, 1);
    expect(game.state.objects[mine].damageMarked).toBe(1);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    hit(game, bears, B, 1);
    expect(life(game, B)).toBe(16);
  });

  it("multipliers apply before additions", () => {
    const game = setUp();
    game.debugSpawn("Dictate of the Twin Gods", A, "battlefield");
    game.debugSpawn(TORBRAN, A, "battlefield");
    const goblin = game.debugSpawn("Raging Goblin", A, "battlefield");
    hit(game, goblin, B, 3);
    expect(life(game, B)).toBe(20 - (3 * 2 + 2));
  });
});

describe("prevention with a follow-up", () => {
  it("The Mindskinner: damage to an opponent is prevented and each opponent mills that many", () => {
    const game = setUp();
    game.debugSpawn(MINDSKINNER, A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    const library = game.state.zones.perPlayer[B].library.length;
    hit(game, giant, B, 3);
    expect(life(game, B)).toBe(20);
    expect(game.state.zones.perPlayer[B].library.length).toBe(library - 3);
    // Not damage to a creature.
    const theirs = game.debugSpawn("Hill Giant", B, "battlefield");
    hit(game, giant, theirs, 3);
    expect(game.state.objects[theirs].damageMarked).toBe(3);
  });

  it("damage to itself becomes +1/+1 counters", () => {
    const game = setUp();
    const sponge = game.debugSpawn(SPONGE, A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    hit(game, giant, sponge, 3);
    expect(game.state.objects[sponge].damageMarked).toBe(0);
    expect(game.state.objects[sponge].counters["+1/+1"]).toBe(3);
    expect(game.characteristics(sponge).power).toBe(5);
  });
});
