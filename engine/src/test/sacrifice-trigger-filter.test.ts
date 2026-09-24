/**
 * The sacrifice trigger's filter and trigger object: "whenever you sacrifice
 * **another nontoken** permanent" (Szarel, Genesis Shepherd), "whenever you
 * sacrifice a creature, you gain life equal to **its** power". The permanent
 * is read as it last existed on the battlefield — a sacrificed token is still
 * a token, a pumped creature has its pumped power.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import type { CardFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const watcher = (name: string, filter: CardFilter | undefined, otherOnly: boolean, effect: EffectSpec) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["creature"],
    power: 1,
    toughness: 1,
    text: name,
    triggered: [
      {
        trigger: {
          on: "sacrifice",
          who: "you",
          ...(filter !== undefined ? { filter } : {}),
          ...(otherOnly ? { otherOnly: true } : {}),
        },
        targets: [],
        effect,
        resolve: null,
        text: name,
      },
    ],
  });

/** "Whenever you sacrifice another nontoken permanent, draw a card." */
const NONTOKEN = "Test Nontoken Watcher";
/** "Whenever you sacrifice a creature, you gain life equal to its power." */
const POWER = "Test Sacrifice Power Watcher";

const registry = createDefaultRegistry()
  .register(watcher(NONTOKEN, { token: false }, true, { kind: "draw", amount: 1 }))
  .register(
    watcher(POWER, { type: "creature" }, false, { kind: "gain-life", amount: { powerOf: "trigger-object" } }),
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
const sacrifice = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "sacrifice-target", target: 0 }, [{ kind: "object", object: id }]);
  game.advanceUntil(quiet);
};
const triggered = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;

describe("a filtered sacrifice trigger", () => {
  it("'another nontoken permanent': a card triggers it, a token and the watcher itself don't", () => {
    const game = setUp();
    const watcherId = game.debugSpawn(NONTOKEN, A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 1 });
    game.advanceUntil(quiet);
    const goblin = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    )!;
    sacrifice(game, goblin);
    expect(triggered(game, watcherId)).toBe(0);

    sacrifice(game, game.debugSpawn("Grizzly Bears", A, "battlefield"));
    expect(triggered(game, watcherId)).toBe(1);

    sacrifice(game, watcherId);
    expect(triggered(game, watcherId)).toBe(1);
  });

  it("the sacrificed creature is the trigger object, read as it last existed", () => {
    const game = setUp();
    game.debugSpawn(POWER, A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      [{ kind: "object", object: bears }],
    );
    sacrifice(game, bears);
    expect(game.state.players[A].life).toBe(25);
  });

  it("sacrificing a noncreature doesn't trigger a creature filter", () => {
    const game = setUp();
    const watcherId = game.debugSpawn(POWER, A, "battlefield");
    sacrifice(game, game.debugSpawn("Island", A, "battlefield"));
    expect(triggered(game, watcherId)).toBe(0);
  });
});
