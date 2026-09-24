/**
 * "…that ability triggers an additional time": the causes `doubleTriggers`
 * gained — a spell cast or copied (Veyran, Voice of Duality), a permanent
 * being dealt damage, a creature dying (Teysa Karlov) — and the source-keyed
 * `doubleTriggersOf`: "if a triggered ability of an Ally you control
 * triggers" (Katara, the Fearless), "of Cloud or an Equipment attached to it"
 * while Cloud is equipped (Cloud, Midgar Mercenary).
 */

import { describe, expect, it } from "vitest";

import type { TriggerSpec } from "../abilities.js";
import type { StaticAbility } from "../cards/define.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const gainOne: EffectSpec = { kind: "gain-life", amount: 1 };

const doubler = (name: string, ability: Omit<StaticAbility, "affects" | "text">, extra = {}) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    static: [{ affects: { scope: "self" }, text: name, ...ability }],
    ...extra,
  });
const creature = (
  name: string,
  subtypes: readonly string[],
  trigger?: TriggerSpec,
  effect: EffectSpec = gainOne,
  statics: readonly StaticAbility[] = [],
) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["creature"],
    subtypes: [...subtypes],
    power: 2,
    toughness: 2,
    text: name,
    static: [...statics],
    triggered:
      trigger === undefined ? [] : [{ trigger, targets: [], effect, resolve: null, text: name }],
  });

const registry = createDefaultRegistry()
  // Katara's shape.
  .register(doubler("Test Ally Doubler", { doubleTriggersOf: { filter: { subtype: "Ally", controlledBy: "you" } } }))
  .register(creature("Test Ally", ["Human", "Ally"], { on: "enters-battlefield", who: "self" }))
  .register(creature("Test Loner", ["Human"], { on: "enters-battlefield", who: "self" }))
  // Cloud's shape: "As long as ~ is equipped, if an ability of ~ or an
  // Equipment attached to it triggers, …"
  .register(
    creature(
      "Test Mercenary",
      ["Human", "Soldier"],
      { on: "step-begins", step: "upkeep", who: "you" },
      gainOne,
      [
        {
          affects: { scope: "self" },
          condition: { kind: "source", filter: { equipped: true } },
          doubleTriggersOf: { selfAndEquipment: true },
          text: "As long as Test Mercenary is equipped, …",
        },
      ],
    ),
  )
  .register(
    defineCard({
      name: "Test Blade",
      manaCost: "{0}",
      types: ["artifact"],
      subtypes: ["Equipment"],
      text: "",
      triggered: [
        {
          trigger: { on: "step-begins", step: "upkeep", who: "you" },
          targets: [],
          effect: gainOne,
          resolve: null,
          text: "At the beginning of your upkeep, you gain 1 life.",
        },
      ],
    }),
  )
  // The new causes.
  .register(doubler("Test Spell Doubler", { doubleTriggers: { cause: "cast-or-copy", filter: { typesAnyOf: ["instant", "sorcery"], controlledBy: "you" } } }))
  .register(
    doubler("Test Spell Watcher", {}, {
      triggered: [
        {
          trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
          targets: [],
          effect: gainOne,
          resolve: null,
          text: "Whenever you cast an instant or sorcery spell, you gain 1 life.",
        },
      ],
    }),
  )
  .register(doubler("Test Damage Doubler", { doubleTriggers: { cause: "dealt-damage", filter: { type: "creature", controlledBy: "you" } } }))
  .register(creature("Test Enraged", ["Dinosaur"], { on: "dealt-damage", who: "self" }))
  .register(doubler("Test Death Doubler", { doubleTriggers: { cause: "dies", filter: { type: "creature" } } }))
  .register(creature("Test Mourner", ["Human"], { on: "dies", who: "you-control", filter: { type: "creature" } }));

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const life = (game: Game, player: PlayerId = A): number => game.state.players[player].life;
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { announceEntry: true });
  game.advanceUntil(quiet);
  return id;
};

describe("doubleTriggersOf: keyed on whose ability it is", () => {
  it("an Ally you control's trigger fires twice; a non-Ally's once", () => {
    const game = setUp();
    game.debugSpawn("Test Ally Doubler", A, "battlefield");
    enter(game, "Test Ally");
    expect(life(game)).toBe(22);
    enter(game, "Test Loner");
    expect(life(game)).toBe(23);
  });

  it("an opponent's Ally isn't yours", () => {
    const game = setUp();
    game.debugSpawn("Test Ally Doubler", A, "battlefield");
    enter(game, "Test Ally", B);
    expect(life(game, B)).toBe(21);
  });

  it("Cloud's shape: its own and its Equipment's abilities, only while equipped", () => {
    const game = setUp();
    game.debugSpawn("Test Mercenary", A, "battlefield");
    const blade = game.debugSpawn("Test Blade", A, "battlefield");
    // Unequipped: one each at the next upkeep.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(life(game)).toBe(22);

    const mercenary = game.battlefield.find((id) => game.state.objects[id].cardName === "Test Mercenary")!;
    game.debugApplyEffect(A, { kind: "attach", target: 0 }, [{ kind: "object", object: mercenary }], {
      source: blade,
    });
    expect(game.state.objects[blade].attachedTo).toBe(mercenary);
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "draw");
    // Equipped: two each.
    expect(life(game)).toBe(26);
  });
});

describe("doubleTriggers' new causes", () => {
  it("cast-or-copy: casting an instant fires the cast trigger twice", () => {
    const game = setUp();
    game.debugSpawn("Test Spell Doubler", A, "battlefield");
    game.debugSpawn("Test Spell Watcher", A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    game.advanceUntil(quiet);
    expect(life(game)).toBe(22);
    expect(life(game, B)).toBe(17);
  });

  it("dealt-damage: a creature you control being dealt damage", () => {
    const game = setUp();
    game.debugSpawn("Test Damage Doubler", A, "battlefield");
    const dino = game.debugSpawn("Test Enraged", A, "battlefield");
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [{ kind: "object", object: dino }]);
    game.advanceUntil(quiet);
    expect(life(game)).toBe(22);
  });

  it("dies: a creature dying fires its watchers twice", () => {
    const game = setUp();
    game.debugSpawn("Test Death Doubler", A, "battlefield");
    game.debugSpawn("Test Mourner", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    game.advanceUntil(quiet);
    expect(life(game)).toBe(22);
  });
});
