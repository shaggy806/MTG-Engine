/**
 * "Whenever one or more creatures you control deal combat damage to a player"
 * — the batched damage trigger (`deals-damage-batch`): once per player dealt
 * damage in one simultaneous damage event, however many creatures dealt it,
 * with that player as the trigger player and the total as the trigger value
 * (Anowon's "a card for each 1 damage dealt to them"). First-strike and
 * regular damage are two events. `once: "per-event"` is Malcolm, Keen-Eyed
 * Navigator's "a Treasure token for each opponent dealt damage".
 */

import { describe, expect, it } from "vitest";

import type { TriggerSpec } from "../abilities.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const watcher = (name: string, trigger: TriggerSpec, effect: EffectSpec) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    triggered: [{ trigger, targets: [], effect, resolve: null, text: name }],
  });

/** "…deal combat damage to a player, that player loses life equal to the
 * damage dealt to them" (the trigger value), and you draw a card. */
const FACE_BREAKER = "Test Face-Breaker";
/** "Whenever one or more Pirates you control deal combat damage to a player,
 * you gain 1 life." */
const PIRATE_WATCHER = "Test Pirate Watcher";
/** Malcolm's shape: "Whenever one or more Pirates you control deal damage to
 * your opponents, you gain 1 life for each opponent dealt damage." */
const MALCOLM = "Test Navigator";

const registry = createDefaultRegistry()
  .register(
    watcher(
      FACE_BREAKER,
      { on: "deals-damage-batch", who: "you-control", filter: { type: "creature" }, combat: true },
      {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: { triggerValue: true }, who: "trigger-player" },
          { kind: "draw", amount: 1 },
        ],
      },
    ),
  )
  .register(
    watcher(
      PIRATE_WATCHER,
      { on: "deals-damage-batch", who: "you-control", filter: { subtype: "Pirate" }, combat: true },
      { kind: "gain-life", amount: 1 },
    ),
  )
  .register(
    watcher(
      MALCOLM,
      { on: "deals-damage-batch", who: "you-control", filter: { subtype: "Pirate" }, to: "opponent", once: "per-event" },
      { kind: "gain-life", amount: { triggerValue: true } },
    ),
  )
  .register(
    defineCard({
      name: "Test Pirate",
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Human", "Pirate"],
      power: 1,
      toughness: 1,
      text: "",
    }),
  )
  .register(
    defineCard({
      name: "Test First-Striking Pirate",
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Human", "Pirate"],
      power: 1,
      toughness: 1,
      keywords: ["first-strike"],
      text: "First strike",
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
  return { game, a: controllers[A] };
};

const creature = (game: Game, name: string): ObjectId =>
  game.debugSpawn(name, A, "battlefield", { summoningSick: false });
const toPostcombat = (game: Game) =>
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");
const fired = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

describe("once per player dealt damage", () => {
  it("two attackers hitting one player fire it once, for the total", () => {
    const { game, a } = setUp();
    const breaker = game.debugSpawn(FACE_BREAKER, A, "battlefield");
    const bears = creature(game, "Grizzly Bears");
    const giant = creature(game, "Hill Giant");
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: giant, defender: B },
    ];
    const hand = game.handOf(A).length;
    toPostcombat(game);
    expect(fired(game, breaker)).toBe(1);
    // 5 combat damage, then that much life again.
    expect(life(game, B)).toBe(10);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("two players hit fire it once each, each the trigger player", () => {
    const { game, a } = setUp([A, B, C]);
    const breaker = game.debugSpawn(FACE_BREAKER, A, "battlefield");
    const bears = creature(game, "Grizzly Bears");
    const giant = creature(game, "Hill Giant");
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: giant, defender: C },
    ];
    toPostcombat(game);
    expect(fired(game, breaker)).toBe(2);
    expect(life(game, B)).toBe(16);
    expect(life(game, C)).toBe(14);
  });

  it("only matching sources count, and none means no trigger", () => {
    const { game, a } = setUp();
    const watcherId = game.debugSpawn(PIRATE_WATCHER, A, "battlefield");
    const bears = creature(game, "Grizzly Bears");
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    toPostcombat(game);
    expect(fired(game, watcherId)).toBe(0);
  });

  it("first-strike and regular damage are two events", () => {
    const { game, a } = setUp();
    const watcherId = game.debugSpawn(PIRATE_WATCHER, A, "battlefield");
    const early = creature(game, "Test First-Striking Pirate");
    const late = creature(game, "Test Pirate");
    a.declareAttackersFn = () => [
      { attacker: early, defender: B },
      { attacker: late, defender: B },
    ];
    toPostcombat(game);
    expect(fired(game, watcherId)).toBe(2);
    expect(life(game, A)).toBe(22);
  });
});

describe("once per event", () => {
  it("Malcolm: one trigger, valued by the number of opponents dealt damage", () => {
    const { game, a } = setUp([A, B, C]);
    const malcolm = game.debugSpawn(MALCOLM, A, "battlefield");
    const one = creature(game, "Test Pirate");
    const two = creature(game, "Test Pirate");
    const three = creature(game, "Test Pirate");
    a.declareAttackersFn = () => [
      { attacker: one, defender: B },
      { attacker: two, defender: B },
      { attacker: three, defender: C },
    ];
    toPostcombat(game);
    expect(fired(game, malcolm)).toBe(1);
    expect(life(game, A)).toBe(22);
  });
});
