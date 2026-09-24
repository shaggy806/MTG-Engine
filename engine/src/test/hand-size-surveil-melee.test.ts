/**
 * Three small ones: maximum hand size statics, read at cleanup ("your maximum
 * hand size is eleven"; Winter, Misanthropic Guide's "each opponent's maximum
 * hand size is equal to seven minus the number of those card types"); a
 * "whenever you surveil" trigger (Mirko, Obsessive Theorist); and melee
 * (rule 702.121 — +1/+1 for each opponent you attacked this combat).
 */

import { describe, expect, it } from "vitest";

import type { StaticAbility } from "../cards/define.js";
import { defineCard } from "../cards/define.js";
import { melee } from "../cards/helpers.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const enchantment = (name: string, ability: Omit<StaticAbility, "text" | "affects">) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    static: [{ affects: { scope: "self" }, ...ability, text: name } as StaticAbility],
  });

const ELEVEN = "Test Eleven Cards";
const WINTER = "Test Misanthropic Guide";
const MIRKO = "Test Obsessive Theorist";
const TIFA = "Test Martial Artist";
const registry = createDefaultRegistry()
  .register(enchantment(ELEVEN, { maxHandSize: { who: "you", set: 11 } }))
  .register(
    enchantment(WINTER, {
      maxHandSize: { who: "opponents", set: 7, minus: { cardTypesInGraveyard: { ownedBy: "you" } } },
    }),
  )
  .register(
    defineCard({
      name: MIRKO,
      manaCost: "{0}",
      types: ["enchantment"],
      text: MIRKO,
      triggered: [
        {
          trigger: { on: "surveils", who: "you" },
          targets: [],
          effect: { kind: "gain-life", amount: 1 },
          resolve: null,
          text: MIRKO,
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: TIFA,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Human", "Monk"],
      power: 2,
      toughness: 2,
      text: "Melee",
      triggered: [melee()],
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
    decks: players.map((player) => ({ player, cards: Array<string>(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, controllers };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const run = (game: Game, effect: EffectSpec): void => {
  const source = game.debugSpawn("Island", A, "battlefield");
  game.debugApplyEffect(A, effect, [], { source });
  game.advanceUntil(quiet);
};

describe("maximum hand size", () => {
  it("yours set to eleven: eleven cards are kept through cleanup", () => {
    const { game } = setUp();
    game.state.players[A].maxHandSize = 7;
    game.debugSpawn(ELEVEN, A, "battlefield");
    while (game.handOf(A).length < 11) game.debugSpawn("Island", A, "hand");
    expect(game.handOf(A).length).toBe(11);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.handOf(A).length).toBe(11);
  });

  it("Winter: each opponent's is seven minus the card types in your graveyard", () => {
    const { game } = setUp();
    game.state.players[B].maxHandSize = 7;
    game.debugSpawn(WINTER, A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Island", A, "graveyard");
    // Bob's turn: he ends it with seven cards and a maximum of five.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "end");
    while (game.handOf(B).length < 7) game.debugSpawn("Island", B, "hand");
    game.advanceUntil((s) => s.turn.number === 3);
    expect(game.handOf(B).length).toBe(5);
  });
});

describe("whenever you surveil", () => {
  it("fires for a surveil, not a scry", () => {
    const { game } = setUp();
    game.debugSpawn(MIRKO, A, "battlefield");
    run(game, { kind: "surveil", amount: 2 });
    expect(game.state.players[A].life).toBe(21);
    run(game, { kind: "scry", amount: 2 });
    expect(game.state.players[A].life).toBe(21);
  });
});

describe("melee", () => {
  it("+1/+1 for each opponent attacked this combat", () => {
    const { game, controllers } = setUp([A, B, C]);
    const tifa = game.debugSpawn(TIFA, A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    controllers[A].declareAttackersFn = () => [
      { attacker: tifa, defender: B },
      { attacker: bears, defender: C },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.characteristics(tifa).power).toBe(4);
    expect(game.characteristics(tifa).toughness).toBe(4);
  });
});
