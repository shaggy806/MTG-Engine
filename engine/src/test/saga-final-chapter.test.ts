/**
 * "Whenever the final chapter ability of a Saga you control resolves" (Tom
 * Bombadil, Narci, Fable Singer) — the `chapter-resolves` trigger and its
 * `finalOnly` — and a completed Saga's sacrifice (rule 714.4) being a real
 * sacrifice that "whenever you sacrifice an enchantment" sees.
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

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const watcher = (name: string, trigger: TriggerSpec, effect: EffectSpec) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["artifact"],
    text: name,
    triggered: [{ trigger, targets: [], effect, resolve: null, text: name }],
  });

/** "Whenever the final chapter ability of a Saga you control resolves, each
 * opponent loses X life and you gain X life, where X is that Saga's mana
 * value." */
const FABLE = "Test Fable Singer";
/** "Whenever a chapter ability of a Saga you control resolves, you gain 1
 * life." */
const LISTENER = "Test Story Listener";
/** "Whenever you sacrifice an enchantment, draw a card." */
const MOURNER = "Test Enchantment Mourner";

const registry = createDefaultRegistry()
  .register(
    watcher(
      FABLE,
      { on: "chapter-resolves", who: "you-control", finalOnly: true },
      {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: { manaValueOf: "trigger-object" }, who: "each-opponent" },
          { kind: "gain-life", amount: { manaValueOf: "trigger-object" } },
        ],
      },
    ),
  )
  .register(watcher(LISTENER, { on: "chapter-resolves", who: "you-control" }, { kind: "gain-life", amount: 1 }))
  .register(
    watcher(
      MOURNER,
      { on: "sacrifice", who: "you", filter: { type: "enchantment" } },
      { kind: "draw", amount: 1 },
    ),
  );

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Plains") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const fired = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;
const onTurn = (game: Game, turn: number): void =>
  game.advanceUntil((s) => s.turn.number === turn && s.turn.step === "postcombat-main");

describe("the final chapter ability resolves", () => {
  it("fires once, for the last chapter, reading the sacrificed Saga's mana value", () => {
    const game = setUp();
    const fable = game.debugSpawn(FABLE, A, "battlefield");
    const listener = game.debugSpawn(LISTENER, A, "battlefield");
    const saga = game.debugSpawn("History of Benalia", A, "battlefield");
    onTurn(game, 1);
    expect(fired(game, listener)).toBe(1);
    expect(fired(game, fable)).toBe(0);
    onTurn(game, 3);
    expect(fired(game, listener)).toBe(2);
    expect(fired(game, fable)).toBe(0);
    onTurn(game, 5);
    expect(fired(game, listener)).toBe(3);
    expect(fired(game, fable)).toBe(1);
    // History of Benalia is {1}{W}{W}: three, though it was sacrificed by
    // the time the trigger resolved.
    expect(game.state.objects[saga].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.players[A].life).toBe(20 + 3 + 3);
  });

  it("an opponent's Saga isn't yours", () => {
    const game = setUp();
    const fable = game.debugSpawn(FABLE, A, "battlefield");
    game.debugSpawn("History of Benalia", B, "battlefield");
    onTurn(game, 6);
    expect(fired(game, fable)).toBe(0);
  });
});

describe("a completed Saga is sacrificed", () => {
  it("its controller sacrifices it, and 'whenever you sacrifice an enchantment' sees it", () => {
    const game = setUp();
    const mourner = game.debugSpawn(MOURNER, A, "battlefield");
    const saga = game.debugSpawn("History of Benalia", A, "battlefield");
    onTurn(game, 5);
    expect(game.eventsOfType("permanent-sacrificed").filter((e) => e.object === saga)).toEqual([
      expect.objectContaining({ object: saga, player: A }),
    ]);
    expect(fired(game, mourner)).toBe(1);
  });
});
