/**
 * Rule 400.7: an object that changes zones becomes a new object. A spell's
 * or ability's targets remember which object they were
 * (`GameObject.targetStints`), so a creature flickered in response is no
 * longer the one a removal spell targeted and the spell fizzles; and a
 * delayed trigger remembers which object its source was
 * (`DelayedTrigger.sourceStint`), so The Locust God's "return it to its
 * owner's hand at the beginning of the next end step" finds nothing once
 * the card has left the graveyard and come back as a new object — while
 * what a delayed trigger only reads (Mana Drain's "that spell's mana value")
 * still reads the object as it last existed.
 */

import { describe, expect, it } from "vitest";

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

/** "When this creature dies, return it to its owner's hand at the beginning
 * of the next end step." */
const LOCUST = "Test Locust Deity";
/** "{0}: Put a +1/+1 counter on this creature." */
const GROWER = "Test Self Grower";
const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: GROWER,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Elf"],
      power: 1,
      toughness: 1,
      text: GROWER,
      activated: [
        {
          cost: { mana: "{0}", tap: false },
          targets: [],
          effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          resolve: null,
          text: GROWER,
        },
      ],
    }),
  )
  .register(
  defineCard({
    name: LOCUST,
    manaCost: "{0}",
    types: ["creature"],
    subtypes: ["God"],
    power: 4,
    toughness: 4,
    text: LOCUST,
    triggered: [
      {
        trigger: { on: "dies", who: "self" },
        targets: [],
        effect: {
          kind: "delayed-trigger",
          at: "next-end-step",
          effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
          text: "Return it to its owner's hand.",
        },
        resolve: null,
        text: LOCUST,
      },
    ],
  }),
);

const setUp = (hand: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Swamp")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const apply = (game: Game, effect: EffectSpec, target: ObjectId): void => {
  game.debugApplyEffect(A, effect, [{ kind: "object", object: target }]);
};

describe("a target that changed zones is a new object", () => {
  it("a creature flickered in response: the removal spell fizzles", () => {
    const game = setUp(["Doom Blade"]);
    game.debugSpawn("Swamp", A, "battlefield");
    game.debugSpawn("Swamp", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const blade = game.handOf(A).find((id) => game.state.objects[id].cardName === "Doom Blade")!;
    game.dispatch({ type: "cast-spell", player: A, card: blade, targets: [{ kind: "object", object: bears }] });
    // In response: exile it and return it — a new object, same card.
    apply(game, { kind: "flicker", target: 0 }, bears);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.eventsOfType("spell-fizzled").some((e) => e.object === blade)).toBe(true);
  });

  it("…and without the round trip it resolves as ever", () => {
    const game = setUp(["Doom Blade"]);
    game.debugSpawn("Swamp", A, "battlefield");
    game.debugSpawn("Swamp", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const blade = game.handOf(A).find((id) => game.state.objects[id].cardName === "Doom Blade")!;
    game.dispatch({ type: "cast-spell", player: A, card: blade, targets: [{ kind: "object", object: bears }] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });
});

describe("a delayed trigger's source", () => {
  it("The Locust God: returned at the next end step", () => {
    const game = setUp();
    const locust = game.debugSpawn(LOCUST, A, "battlefield");
    apply(game, { kind: "destroy", target: 0 }, locust);
    game.advanceUntil(quiet);
    expect(game.state.objects[locust].zone).toBe("graveyard");
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(game.state.objects[locust].zone).toBe("hand");
  });

  it("…but not once it has left the graveyard and come back as a new object", () => {
    const game = setUp();
    const locust = game.debugSpawn(LOCUST, A, "battlefield");
    apply(game, { kind: "destroy", target: 0 }, locust);
    game.advanceUntil(quiet);
    // Off to the top of the library and milled back: a graveyard card again,
    // but not the one that died.
    apply(game, { kind: "put-on-library", target: 0, position: "top" }, locust);
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 1 });
    expect(game.state.objects[locust].zone).toBe("graveyard");
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(game.state.objects[locust].zone).toBe("graveyard");
  });
});

describe("exiled until an event that has already happened (rule 610.3c)", () => {
  it("an O-Ring whose source left before it resolved exiles nothing", () => {
    const game = setUp();
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield");
    // A second candidate, so the trigger waits for a real choice.
    game.debugSpawn("Hill Giant", B, "battlefield");
    const light = game.debugSpawn("Banishing Light", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "object", object: victim }] });
    // In response, the Banishing Light leaves.
    apply(game, { kind: "destroy", target: 0 }, light);
    game.advanceUntil(quiet);
    expect(game.state.objects[victim].zone).toBe("battlefield");
  });
});

describe("an ability's source that changed zones", () => {
  it("flickered in response: the counter goes on nothing", () => {
    const game = setUp();
    const grower = game.debugSpawn(GROWER, A, "battlefield");
    game.dispatch({ type: "activate-ability", player: A, source: grower, abilityIndex: 0, targets: [] });
    apply(game, { kind: "flicker", target: 0 }, grower);
    game.advanceUntil(quiet);
    expect(game.state.objects[grower].zone).toBe("battlefield");
    expect(game.state.objects[grower].counters["+1/+1"] ?? 0).toBe(0);
  });

  it("…and left alone, it grows", () => {
    const game = setUp();
    const grower = game.debugSpawn(GROWER, A, "battlefield");
    game.dispatch({ type: "activate-ability", player: A, source: grower, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[grower].counters["+1/+1"]).toBe(1);
  });
});
