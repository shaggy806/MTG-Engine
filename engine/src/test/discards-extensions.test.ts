/**
 * The `discards` trigger's `filter`, `perCard` and count: Tergrid, God of
 * Fright's "whenever an opponent … discards a permanent card, you may put
 * that card onto the battlefield under your control from their graveyard"
 * (once per card, the card its trigger object), and "whenever you discard one
 * or more cards, … for each card discarded this way" (once per event, `{
 * triggerValue: true }` how many).
 */

import { describe, expect, it } from "vitest";

import type { TriggerSpec } from "../abilities.js";
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

const watcher = (name: string, trigger: TriggerSpec, effect: EffectSpec) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    triggered: [{ trigger, targets: [], effect, resolve: null, text: name }],
  });

const FRIGHT = "Test God of Fright";
const HOWLER = "Test Sea Scourge";
const registry = createDefaultRegistry()
  .register(
    watcher(
      FRIGHT,
      {
        on: "discards",
        who: "opponent",
        perCard: true,
        filter: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker"] },
      },
      { kind: "put-onto-battlefield", target: "trigger-object", underYourControl: true },
    ),
  )
  .register(
    watcher(HOWLER, { on: "discards", who: "you" }, { kind: "gain-life", amount: { triggerValue: true } }),
  );

const setUp = (aHand: readonly string[], bHand: readonly string[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const fired = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;

describe("discards", () => {
  it("Tergrid: once per permanent card an opponent discards, and it's yours", () => {
    // Bob discards from the front of his hand: the Bears and the Bolt.
    const game = setUp([], ["Grizzly Bears", "Lightning Bolt"]);
    const fright = game.debugSpawn(FRIGHT, A, "battlefield");
    game.debugApplyEffect(A, { kind: "discard", target: "each-opponent", amount: 2 });
    game.advanceUntil(quiet);
    expect(fired(game, fright)).toBe(1);
    const bears = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Grizzly Bears",
    );
    expect(bears).toBeDefined();
    expect(game.state.objects[bears!].controller).toBe(A);
    expect(
      game.state.zones.perPlayer[B].graveyard.map((id) => game.state.objects[id].cardName),
    ).toEqual(["Lightning Bolt"]);
  });

  it("…not your own discards", () => {
    const game = setUp(["Grizzly Bears"], []);
    const fright = game.debugSpawn(FRIGHT, A, "battlefield");
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 });
    game.advanceUntil(quiet);
    expect(fired(game, fright)).toBe(0);
  });

  it("once per discard event, counting the cards", () => {
    const game = setUp(["Grizzly Bears", "Lightning Bolt", "Hill Giant"], []);
    const howler = game.debugSpawn(HOWLER, A, "battlefield");
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 3 });
    game.advanceUntil(quiet);
    expect(fired(game, howler)).toBe(1);
    expect(game.state.players[A].life).toBe(23);
  });
});
