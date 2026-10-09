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

// An opponent's commander is public, and so is what it costs them: the
// command zone, the tax and the permanents that change it are all in plain
// view (a bug report, 2026-10-08: reductions on opponents' commanders
// didn't show).
describe("the cost shown for an opponent's commander", () => {
  const withCommander = () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: Array<string>(40).fill("Island") },
        { player: B, cards: Array<string>(40).fill("Swamp"), commanders: ["Sheoldred, the Apocalypse"] },
      ],
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    const commander = game.state.zones.shared.command.find(
      (id) => game.state.objects[id]?.cardName === "Sheoldred, the Apocalypse",
    );
    if (commander === undefined) throw new Error("no commander in the command zone");
    return { game, commander };
  };

  it("shows its owner's reduction to everyone at the table", () => {
    const { game, commander } = withCommander();
    spawn(game, "Bontu's Monument", B);
    expect(shown(game, commander)).toBe("{1}{B}{B}");
    expect(game.viewFor(B).objects[commander]?.effectiveManaCost).toBe("{1}{B}{B}");
  });

  it("is priced for its owner, not the viewer: our reducer doesn't touch it", () => {
    const { game, commander } = withCommander();
    spawn(game, "Bontu's Monument", A);
    expect(shown(game, commander)).toBeUndefined();
  });

  it("an opponent's hand stays hidden, reduced or not", () => {
    const { game } = withCommander();
    spawn(game, "Bontu's Monument", B);
    const card = game.debugSpawn("Bloodthirsty Aerialist", B, "hand");
    expect(game.viewFor(A).objects[card]?.effectiveManaCost).toBeUndefined();
  });
});
