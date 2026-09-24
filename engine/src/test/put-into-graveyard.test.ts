/**
 * Cards put into a graveyard: the `cards-put-into-graveyard` event (one per
 * simultaneous move — a mill, a discard, a wrath or a state-based sweep) and
 * the `put-into-graveyard` trigger on it — The Gitrog Monster's "whenever one
 * or more land cards are put into your graveyard from anywhere" (batched),
 * Sidisi, Brood Tyrant's "…creature cards … from your library", Syr Konrad's
 * "whenever a creature card is put into a graveyard from anywhere other than
 * the battlefield" (per card), Disa the Restless's "…put it onto the
 * battlefield". Tokens aren't cards.
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

const gainValue: EffectSpec = { kind: "gain-life", amount: { triggerValue: true } };
const GITROG = "Test Gitrog";
const SIDISI = "Test Sidisi";
const KONRAD = "Test Konrad";
const DISA = "Test Disa";
/** "Whenever a creature card leaves your graveyard, you gain 1 life." */
const LEAVER = "Test Graveyard Leaver";

const registry = createDefaultRegistry()
  .register(
    watcher(GITROG, { on: "put-into-graveyard", who: "you", filter: { type: "land" }, batched: true }, gainValue),
  )
  .register(
    watcher(
      SIDISI,
      { on: "put-into-graveyard", who: "you", filter: { type: "creature" }, from: "library", batched: true },
      gainValue,
    ),
  )
  .register(
    watcher(
      KONRAD,
      { on: "put-into-graveyard", who: "any", filter: { type: "creature" }, notFrom: "battlefield" },
      { kind: "gain-life", amount: 1 },
    ),
  )
  .register(
    watcher(
      LEAVER,
      { on: "leaves-graveyard", who: "you", filter: { type: "creature" }, perCard: true },
      { kind: "gain-life", amount: 1 },
    ),
  )
  .register(
    watcher(
      DISA,
      { on: "put-into-graveyard", who: "you", filter: { type: "creature" }, notFrom: "battlefield" },
      { kind: "put-onto-battlefield", target: "trigger-object" },
    ),
  );

/** Alice's opening hand and first draw take the top eight cards, so a mill
 * starts at the ninth. */
const deck = (...afterHand: string[]): string[] => [
  ...Array<string>(8).fill("Island"),
  ...afterHand,
  ...Array<string>(40).fill("Island"),
];
const setUp = (aDeck: readonly string[] = deck()) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aDeck] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const run = (game: Game, effect: EffectSpec, target?: ObjectId, player: PlayerId = A): void => {
  game.debugApplyEffect(player, effect, target === undefined ? [] : [{ kind: "object", object: target }]);
  game.advanceUntil(quiet);
};
const fired = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;
const life = (game: Game): number => game.state.players[A].life;

describe("one or more cards (batched)", () => {
  it("a mill of three lands is one trigger, valued three", () => {
    const game = setUp();
    const gitrog = game.debugSpawn(GITROG, A, "battlefield");
    run(game, { kind: "mill", target: "you", amount: 3 });
    expect(fired(game, gitrog)).toBe(1);
    expect(life(game)).toBe(23);
  });

  it("discarding lands counts too — from anywhere", () => {
    const game = setUp();
    const gitrog = game.debugSpawn(GITROG, A, "battlefield");
    run(game, { kind: "discard-hand", who: "you" });
    expect(fired(game, gitrog)).toBe(1);
    expect(life(game)).toBe(20 + 8);
  });

  it("from your library only: a mill counts, a creature dying doesn't", () => {
    const game = setUp(deck("Grizzly Bears", "Hill Giant"));
    const sidisi = game.debugSpawn(SIDISI, A, "battlefield");
    run(game, { kind: "mill", target: "you", amount: 3 });
    expect(fired(game, sidisi)).toBe(1);
    expect(life(game)).toBe(22);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    run(game, { kind: "destroy", target: 0 }, bears);
    expect(fired(game, sidisi)).toBe(1);
  });

  it("a wrath's creatures are put there together", () => {
    const game = setUp();
    const watcherId = game.debugSpawn(GITROG, A, "battlefield");
    // Lands that are creatures: animate two Islands, then wrath.
    const lands = [game.debugSpawn("Island", A, "battlefield"), game.debugSpawn("Island", A, "battlefield")];
    for (const land of lands) {
      run(
        game,
        {
          kind: "animate",
          target: 0,
          power: 1,
          toughness: 1,
          addTypes: ["creature"],
          addSubtypes: [],
          duration: "end-of-turn",
        },
        land,
      );
    }
    run(game, { kind: "destroy-all", filter: { type: "creature" } });
    expect(fired(game, watcherId)).toBe(1);
    expect(life(game)).toBe(22);
  });
});

describe("each card", () => {
  it("fires once per matching card, not from the battlefield", () => {
    const game = setUp(deck("Grizzly Bears", "Hill Giant"));
    const konrad = game.debugSpawn(KONRAD, A, "battlefield");
    run(game, { kind: "mill", target: "you", amount: 3 });
    expect(fired(game, konrad)).toBe(2);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    run(game, { kind: "destroy", target: 0 }, bears);
    expect(fired(game, konrad)).toBe(2);
  });

  it("tokens aren't cards", () => {
    const game = setUp();
    const konrad = game.debugSpawn(KONRAD, A, "battlefield");
    const gitrog = game.debugSpawn(GITROG, A, "battlefield");
    run(game, { kind: "create-token", token: "Goblin Token", count: 1 });
    const goblin = game.battlefield.find((id) => game.state.objects[id].cardName === "Goblin Token")!;
    run(game, { kind: "destroy", target: 0 }, goblin);
    expect(fired(game, konrad)).toBe(0);
    expect(fired(game, gitrog)).toBe(0);
  });

  it("Disa: 'put it onto the battlefield' — the card is the trigger object", () => {
    const game = setUp(deck("Grizzly Bears"));
    game.debugSpawn(DISA, A, "battlefield");
    run(game, { kind: "mill", target: "you", amount: 1 });
    const bears = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Grizzly Bears",
    );
    expect(bears).toBeDefined();
  });

  it("…and finds it only in the graveyard it was put into", () => {
    const game = setUp(deck("Grizzly Bears"));
    game.debugSpawn(DISA, A, "battlefield");
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 1 });
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    const bears = game.state.zones.perPlayer[A].graveyard.find(
      (id) => game.state.objects[id].cardName === "Grizzly Bears",
    )!;
    run(game, { kind: "exile", target: 0 }, bears);
    expect(game.state.objects[bears].zone).toBe("exile");
  });
});

describe("leaving a graveyard, per card", () => {
  it("a whole graveyard exiled at once fires once per creature card", () => {
    const game = setUp(deck("Grizzly Bears", "Hill Giant"));
    const leaver = game.debugSpawn(LEAVER, A, "battlefield");
    run(game, { kind: "mill", target: "you", amount: 3 });
    run(game, { kind: "exile-graveyard", target: "you" });
    expect(fired(game, leaver)).toBe(2);
    expect(life(game)).toBe(22);
  });
});

describe("look and choose, the rest into the graveyard", () => {
  it("one card to hand, the rest put into the graveyard in one move", () => {
    const game = setUp(deck("Grizzly Bears", "Hill Giant", "Island", "Island"));
    const gitrog = game.debugSpawn(GITROG, A, "battlefield");
    const hand = game.handOf(A).length;
    const graveyard = game.state.zones.perPlayer[A].graveyard.length;
    run(game, {
      kind: "look-and-choose",
      zone: "library",
      count: 4,
      min: 1,
      max: 1,
      destination: "hand",
      leftover: "graveyard",
      filter: { type: "creature" },
    });
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(graveyard + 3);
    // Two Islands among the three — one batched trigger.
    expect(fired(game, gitrog)).toBe(1);
    expect(life(game)).toBe(22);
  });
});
