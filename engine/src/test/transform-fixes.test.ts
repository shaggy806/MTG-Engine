/**
 * Two transform rules:
 *
 * - a transforming double-faced card that enters the battlefield transformed
 *   has its back face up as it enters, so the replacements that apply as it
 *   enters are the back face's — a planeswalker back face enters with its
 *   loyalty (Nicol Bolas, the Ravager's "exile Nicol Bolas, then return him
 *   to the battlefield transformed");
 * - rule 701.28f: an ability of a permanent transforms it only if it hasn't
 *   transformed since the ability was put on the stack, and a delayed
 *   triggered ability only if it hasn't since the delayed ability was
 *   created (Aang, at the Crossroads' "transform Aang at the beginning of
 *   the next upkeep").
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const SEER = "Test Walker Seer";
const WALKER = "Test Awakened Walker";
const PUP = "Test Moon Pup";
const HOWLER = "Test Moon Howler";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: SEER,
      manaCost: "{2}{G}",
      types: ["creature"],
      subtypes: ["Elf"],
      power: 1,
      toughness: 1,
      text: "",
      faces: [SEER, WALKER],
      transform: true,
    }),
  )
  .register(
    defineCard({
      name: WALKER,
      types: ["planeswalker"],
      subtypes: ["Test"],
      loyalty: 3,
      text: "",
    }),
  )
  .register(
    defineCard({
      name: PUP,
      manaCost: "{1}{R}",
      types: ["creature"],
      subtypes: ["Wolf"],
      power: 2,
      toughness: 2,
      text: "{0}: Transform this.\n{0}: At the beginning of the next end step, transform this.",
      activated: [
        {
          cost: { mana: "{0}", tap: false },
          targets: [],
          effect: { kind: "transform", target: "source" },
          resolve: null,
          text: "{0}: Transform this.",
        },
        {
          cost: { mana: "{0}", tap: false },
          targets: [],
          effect: {
            kind: "delayed-trigger",
            at: "next-end-step",
            effect: { kind: "transform", target: "source" },
            text: "Transform this.",
          },
          resolve: null,
          text: "{0}: At the beginning of the next end step, transform this.",
        },
      ],
      faces: [PUP, HOWLER],
      transform: true,
    }),
  )
  .register(
    defineCard({
      name: HOWLER,
      types: ["creature"],
      subtypes: ["Wolf"],
      power: 4,
      toughness: 4,
      text: "{0}: Transform this.",
      activated: [
        {
          cost: { mana: "{0}", tap: false },
          targets: [],
          effect: { kind: "transform", target: "source" },
          resolve: null,
          text: "{0}: Transform this.",
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
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const activate = (game: Game, source: ObjectId, abilityIndex: number): void => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets: [] });
};
const face = (game: Game, id: ObjectId): number => game.state.objects[id].face ?? 0;

describe("entering transformed", () => {
  it("a planeswalker back face enters with its loyalty, and stays", () => {
    const game = setUp();
    const seer = game.debugSpawn(SEER, A, "exile");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0, transformed: true }, [
      { kind: "object", object: seer },
    ]);
    game.advanceUntil(quiet);
    expect(game.state.objects[seer].zone).toBe("battlefield");
    expect(face(game, seer)).toBe(1);
    expect(game.state.objects[seer].counters.loyalty).toBe(3);
  });

  it("…and entering the ordinary way, it's the front face with none", () => {
    const game = setUp();
    const seer = game.debugSpawn(SEER, A, "exile");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: seer }]);
    game.advanceUntil(quiet);
    expect(face(game, seer)).toBe(0);
    expect(game.state.objects[seer].counters.loyalty ?? 0).toBe(0);
  });
});

describe("rule 701.28f", () => {
  it("two transform activations on the stack: the second does nothing", () => {
    const game = setUp();
    const pup = game.debugSpawn(PUP, A, "battlefield");
    activate(game, pup, 0);
    activate(game, pup, 0);
    game.advanceUntil(quiet);
    expect(face(game, pup)).toBe(1);
  });

  it("one activated after the last transform still transforms it", () => {
    const game = setUp();
    const pup = game.debugSpawn(PUP, A, "battlefield");
    activate(game, pup, 0);
    game.advanceUntil(quiet);
    expect(face(game, pup)).toBe(1);
    // The Howler's own "{0}: Transform this."
    activate(game, pup, 0);
    game.advanceUntil(quiet);
    expect(face(game, pup)).toBe(0);
  });

  it("a delayed trigger transforms it at the end step…", () => {
    const game = setUp();
    const pup = game.debugSpawn(PUP, A, "battlefield");
    activate(game, pup, 1);
    game.advanceUntil(quiet);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(face(game, pup)).toBe(1);
  });

  it("…but not if it has transformed since the delayed trigger was created", () => {
    const game = setUp();
    const pup = game.debugSpawn(PUP, A, "battlefield");
    activate(game, pup, 1);
    game.advanceUntil(quiet);
    activate(game, pup, 0);
    game.advanceUntil(quiet);
    expect(face(game, pup)).toBe(1);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(face(game, pup)).toBe(1);
  });
});
