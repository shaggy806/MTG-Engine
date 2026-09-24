/**
 * "[It] becomes a Demon **in addition to its other types**" — the `add-types`
 * effect (Clavileño, First of the Blessed; Jenova, Ancient Calamity): types
 * and subtypes added in layer 4 and nothing else, until end of turn or for as
 * long as the permanent stays on the battlefield. Unlike `animate` it leaves
 * P/T alone, and because it is layer 4 a lord reads the new type.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { effectiveSubtypes, effectiveTypes } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "Demons you control get +1/+1." */
const DEMON_LORD = "Test Demon Lord";

const registry = createDefaultRegistry().register(
  defineCard({
    name: DEMON_LORD,
    manaCost: "{0}",
    types: ["enchantment"],
    text: "Demons you control get +1/+1.",
    static: [
      {
        affects: { scope: "filter", filter: { subtype: "Demon", controlledBy: "you" } },
        grantPt: [1, 1],
        text: "Demons you control get +1/+1.",
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
const subtypes = (game: Game, id: ObjectId): readonly string[] =>
  effectiveSubtypes(game.state, registry, game.state.objects[id]);
const becomeDemon = (duration: "end-of-turn" | "permanent"): EffectSpec => ({
  kind: "add-types",
  target: 0,
  addSubtypes: ["Demon"],
  duration,
});
const apply = (game: Game, effect: EffectSpec, id: ObjectId): void => {
  game.debugApplyEffect(A, effect, [{ kind: "object", object: id }]);
  game.advanceUntil(quiet);
};

describe("becomes a Demon in addition to its other types", () => {
  it("adds the subtype and keeps the rest — P/T included", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    apply(game, becomeDemon("end-of-turn"), bears);
    expect(subtypes(game, bears)).toEqual(expect.arrayContaining(["Bear", "Demon"]));
    expect(game.characteristics(bears).power).toBe(2);
    expect(game.characteristics(bears).toughness).toBe(2);
  });

  it("a lord of the new type reaches it (layer 4 before layer 7)", () => {
    const game = setUp();
    game.debugSpawn(DEMON_LORD, A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(game.characteristics(bears).power).toBe(2);
    apply(game, becomeDemon("permanent"), bears);
    expect(game.characteristics(bears).power).toBe(3);
  });

  it("until end of turn wears off; permanent lasts until it leaves", () => {
    const game = setUp();
    const brief = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const lasting = game.debugSpawn("Hill Giant", A, "battlefield");
    apply(game, becomeDemon("end-of-turn"), brief);
    apply(game, becomeDemon("permanent"), lasting);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(subtypes(game, brief)).not.toContain("Demon");
    expect(subtypes(game, lasting)).toContain("Demon");

    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: lasting }]);
    game.advanceUntil(quiet);
    expect(subtypes(game, lasting)).not.toContain("Demon");
  });

  it("adds card types too", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    apply(game, { kind: "add-types", target: 0, addTypes: ["artifact"], duration: "permanent" }, bears);
    expect(effectiveTypes(game.state, registry, game.state.objects[bears])).toEqual(
      expect.arrayContaining(["creature", "artifact"]),
    );
  });

  it("reaches a card returned to the battlefield earlier in the same resolution", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    apply(
      game,
      {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          { kind: "add-types", target: 0, addSubtypes: ["Zombie"], duration: "permanent" },
        ],
      },
      bears,
    );
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(subtypes(game, bears)).toEqual(expect.arrayContaining(["Bear", "Zombie"]));
  });
});
