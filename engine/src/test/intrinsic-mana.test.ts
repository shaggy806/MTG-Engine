/**
 * Intrinsic mana abilities (rules 305.6, 305.7): a land with a basic land
 * type has "{T}: Add [its colour]" — for each type it has now, one an effect
 * gave it included, and not for one it has lost. A typed land's printed
 * "{T}: Add" is the stand-in for its printed types' abilities, and goes with
 * them.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { POOL_CARDS } from "../cards/generated.js";
import { intrinsicStandIns } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import { BASIC_LAND_TYPE_COLORS, EVERY_LAND_TYPE } from "../subtypes.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

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
const castable = (game: Game, name: string): boolean => {
  const card = game.debugSpawn(name, A, "hand");
  return game.legalActions(A).some((action) => action.kind === "cast-spell" && action.card === card);
};
const everyLandType = (game: Game, id: ObjectId): void =>
  game.debugApplyEffect(A, { kind: "add-types", target: 0, addSubtypes: [EVERY_LAND_TYPE], duration: "permanent" }, [
    { kind: "object", object: id },
  ]);
/** It becomes a Mountain, and nothing else changes (rule 305.7). */
const mountain = (game: Game, id: ObjectId): void =>
  game.debugApplyEffect(
    B,
    {
      kind: "animate",
      target: 0,
      power: 0,
      toughness: 0,
      addTypes: [],
      addSubtypes: [],
      setSubtypes: ["Mountain"],
      duration: "permanent",
    },
    [{ kind: "object", object: id }],
  );

describe("intrinsic mana abilities", () => {
  it("every typed land's printed '{T}: Add' stands in for exactly its basic land types", () => {
    const wrong: string[] = [];
    for (const def of POOL_CARDS) {
      if (!def.types.includes("land")) continue;
      const printed = BASIC_LAND_TYPE_COLORS.filter(([type]) => def.subtypes.includes(type)).map(([, c]) => c);
      const covered = new Set(intrinsicStandIns(def).flatMap((colors) => colors ?? []));
      if (printed.some((c) => !covered.has(c)) || covered.size !== printed.length) wrong.push(def.name);
    }
    expect(wrong).toEqual([]);
  });

  it("a land given a basic land type taps for its colour too", () => {
    const game = setUp();
    const wastes = game.debugSpawn("Wastes", A, "battlefield");
    expect(castable(game, "Llanowar Elves")).toBe(false);
    everyLandType(game, wastes);
    expect(castable(game, "Llanowar Elves")).toBe(true);
    // And by hand: its own {C} and one ability per colour.
    const offered = game
      .legalActions(A)
      .filter((action) => action.kind === "activate-ability" && action.source === wastes)
      .map((action) => (action.kind === "activate-ability" ? action.text : ""));
    expect(offered.sort()).toEqual(
      ["{T}: Add {B}.", "{T}: Add {C}.", "{T}: Add {G}.", "{T}: Add {R}.", "{T}: Add {U}.", "{T}: Add {W}."].sort(),
    );
    expect(game.viewFor(A).objects[wastes]?.text).toContain("({T}: Add {W}, {U}, {B}, {R}, or {G}.)");
  });

  it("a Forest given every land type has one {G} ability, not two", () => {
    const game = setUp();
    const forest = game.debugSpawn("Forest", A, "battlefield");
    everyLandType(game, forest);
    const green = game
      .legalActions(A)
      .filter((action) => action.kind === "activate-ability" && action.source === forest && action.text === "{T}: Add {G}.");
    expect(green).toHaveLength(1);
  });

  it("a land made a Mountain loses the rest (rule 305.7): Tropical Island taps for {R} alone", () => {
    const game = setUp();
    const island = game.debugSpawn("Tropical Island", A, "battlefield");
    expect(castable(game, "Llanowar Elves")).toBe(true);
    mountain(game, island);
    expect(castable(game, "Llanowar Elves")).toBe(false);
    expect(castable(game, "Akki Avalanchers")).toBe(true);
    const offered = game
      .legalActions(A)
      .filter((action) => action.kind === "activate-ability" && action.source === island)
      .map((action) => (action.kind === "activate-ability" ? action.text : ""));
    expect(offered).toEqual(["{T}: Add {R}."]);
    // Shown as it is now: the printed reminder gives way.
    expect(game.viewFor(A).objects[island]?.text).toBe("({T}: Add {R}.)");
    expect(matchesFilter(game.state, registry, island, { hasManaAbility: true }, { you: A })).toBe(true);
  });

  it("none once it has lost all its abilities, a type it gained later included", () => {
    const game = setUp();
    const forest = game.debugSpawn("Forest", A, "battlefield");
    game.debugApplyEffect(B, { kind: "lose-abilities", target: 0, duration: "permanent" }, [
      { kind: "object", object: forest },
    ]);
    everyLandType(game, forest);
    expect(castable(game, "Llanowar Elves")).toBe(false);
    expect(castable(game, "Opt")).toBe(false);
    expect(game.legalActions(A).some((action) => action.kind === "activate-ability" && action.source === forest)).toBe(
      false,
    );
    expect(matchesFilter(game.state, registry, forest, { hasManaAbility: true }, { you: A })).toBe(false);
  });
});
