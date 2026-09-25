/**
 * A castable card's cost as its owner would actually pay it
 * (`VisibleObject.effectiveManaCost`): the generic number rewritten, a pip a
 * coloured reduction took dropped, and a twobrid pip's generic half lowered
 * by a generic reduction that outran the generic part.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { defineCard } from "../cards/define.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();
// Edgewalker's shape over every creature: "cost {W}{B} less".
registry.register(
  defineCard({
    name: "Test Coloured Reducer",
    manaCost: "{3}",
    types: ["artifact"],
    text: "Creature spells you cast cost {W}{B} less to cast.",
    static: [
      {
        affects: { scope: "self" },
        costModification: { applies: { type: "creature" }, caster: "you", reduceColored: "{W}{B}" },
        text: "Creature spells you cast cost {W}{B} less to cast.",
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
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const shown = (game: Game, card: ObjectId) => game.viewFor(A).objects[card]?.effectiveManaCost;

describe("the cost shown for a reduced spell", () => {
  it("nothing changes it: the printed cost stands", () => {
    const game = setUp();
    const card = game.debugSpawn("Bloodthirsty Aerialist", A, "hand");
    expect(shown(game, card)).toBeUndefined();
  });

  it("a generic reduction rewrites the number (Bontu's Monument)", () => {
    const game = setUp();
    spawn(game, "Bontu's Monument");
    const card = game.debugSpawn("Bloodthirsty Aerialist", A, "hand");
    expect(shown(game, card)).toBe("{B}{B}");
  });

  it("a coloured reduction drops the pip it takes, and one with no pip to take comes off the generic", () => {
    const game = setUp();
    spawn(game, "Test Coloured Reducer");
    const card = game.debugSpawn("Bloodthirsty Aerialist", A, "hand");
    expect(shown(game, card)).toBe("{B}");
  });

  it("a generic reduction past the generic part lowers a twobrid pip (Reaper King)", () => {
    const game = setUp();
    spawn(game, "Bontu's Monument");
    const card = game.debugSpawn("Reaper King", A, "hand");
    expect(shown(game, card)).toBe("{1/W}{2/U}{2/B}{2/R}{2/G}");
  });
});
