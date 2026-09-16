/**
 * "Choose a creature type" over the full catalog (rule 205.3m):
 *
 * - The `choose-creature-type` *effect*, which asks as a spell resolves and
 *   then applies `then` with the answer substituted for
 *   `CHOSEN_CREATURE_TYPE` (Crippling Fear, Distant Melody).
 * - `catalog` telling a full creature-type choice apart from a short fixed
 *   menu that reuses the same decision (Heraldic Banner's colours).
 * - `suggested`: the chooser's most common types, computed only in their own
 *   `legalActions` because it reads their library.
 * - Bots and the fuzzer choosing from `suggested` rather than the alphabetical
 *   catalog, where `options[0]` is "Advisor".
 */

import { describe, expect, it } from "vitest";

import { CREATURE_TYPES } from "../creature-types.js";
import { AutomaticController } from "../controller.js";
import { CHOSEN_CREATURE_TYPE, substituteChosenCreatureType } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = (aDeck: readonly string[] = Array<string>(40).fill("Swamp")) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: aDeck },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });

const openWith = (game: Game, n: number) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const kind of ["Swamp", "Island"]) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
};

const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

const castAndAwaitChoice = (game: Game, card: string) => {
  const id = game.debugSpawn(card, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card: id, targets: [] });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-creature-type" || s.result.over);
  return id;
};

describe("the creature-type catalog", () => {
  it("is the full list, sorted, with the types the pool uses", () => {
    expect(CREATURE_TYPES.length).toBeGreaterThan(300);
    expect([...CREATURE_TYPES]).toEqual([...CREATURE_TYPES].sort((a, b) => a.localeCompare(b)));
    for (const t of ["Zombie", "Dragon", "Human", "Bird", "Eldrazi", "Saproling"]) {
      expect(CREATURE_TYPES).toContain(t);
    }
  });
});

describe("substituteChosenCreatureType", () => {
  it("replaces the placeholder wherever it sits, and nothing else", () => {
    const out = substituteChosenCreatureType(
      {
        kind: "modify-pt-all",
        filter: { type: "creature", notSubtypes: [CHOSEN_CREATURE_TYPE], subtype: "Wall" },
        power: -3,
        toughness: -3,
        duration: "end-of-turn",
      },
      "Zombie",
    );
    expect(out).toEqual({
      kind: "modify-pt-all",
      filter: { type: "creature", notSubtypes: ["Zombie"], subtype: "Wall" },
      power: -3,
      toughness: -3,
      duration: "end-of-turn",
    });
  });
});

describe("Crippling Fear", () => {
  it("asks for a creature type from the full catalog as it resolves", () => {
    const game = makeGame();
    openWith(game, 4);
    castAndAwaitChoice(game, "Crippling Fear");

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-creature-type");
    if (awaiting?.kind !== "choose-creature-type") return;
    expect(awaiting.catalog).toBe(true);
    expect(awaiting.options.length).toBe(CREATURE_TYPES.length);
  });

  it("spares the chosen type and shrinks everyone else's creatures, both sides", () => {
    const game = makeGame();
    openWith(game, 4);
    const myZombie = game.debugSpawn("Vengeful Dead", A, "battlefield");
    const myOther = game.debugSpawn("Serra Angel", A, "battlefield");
    const theirZombie = game.debugSpawn("Vengeful Dead", B, "battlefield");
    const theirOther = game.debugSpawn("Serra Angel", B, "battlefield");

    castAndAwaitChoice(game, "Crippling Fear");
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Zombie" });
    settle(game);

    // Vengeful Dead is a 3/2 Zombie; Serra Angel a 4/4 Angel.
    expect(game.characteristics(myZombie).power).toBe(3);
    expect(game.characteristics(theirZombie).power).toBe(3);
    expect(game.characteristics(myOther).power).toBe(1);
    expect(game.characteristics(theirOther).power).toBe(1);
  });

  it("goes to the graveyard once resolved, and doesn't mark itself chosen", () => {
    const game = makeGame();
    openWith(game, 4);
    const card = castAndAwaitChoice(game, "Crippling Fear");
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Zombie" });
    settle(game);
    expect(game.state.objects[card].zone).toBe("graveyard");
    // The permanent-entering path records the choice on the object; a spell's
    // doesn't — there's no permanent left to read it off.
    expect(game.state.objects[card].chosenOnEnter).toBeUndefined();
  });
});

describe("Distant Melody", () => {
  it("draws one per permanent you control of the chosen type", () => {
    const game = makeGame();
    openWith(game, 4);
    game.debugSpawn("Vengeful Dead", A, "battlefield");
    game.debugSpawn("Vengeful Dead", A, "battlefield");
    game.debugSpawn("Serra Angel", A, "battlefield");
    // An opponent's Zombie is not yours.
    game.debugSpawn("Vengeful Dead", B, "battlefield");

    castAndAwaitChoice(game, "Distant Melody");
    const before = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Zombie" });
    settle(game);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(before + 2);
  });
});

describe("suggestions", () => {
  it("ranks the chooser's own deck and the board, most common first", () => {
    // A's library is full of Zombies; a Dragon and an Angel are on the board.
    const game = makeGame([
      ...Array<string>(10).fill("Vengeful Dead"),
      ...Array<string>(30).fill("Swamp"),
    ]);
    openWith(game, 4);
    game.debugSpawn("Serra Angel", B, "battlefield");
    castAndAwaitChoice(game, "Distant Melody");

    const legal = game.legalActions(A).find((a) => a.kind === "choose-creature-type");
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "choose-creature-type") return;
    expect(legal.catalog).toBe(true);
    expect(legal.suggested[0]).toBe("Zombie");
    // The opponent's board creature is still suggested.
    expect(legal.suggested).toContain("Angel");
    expect(legal.suggested.length).toBeLessThanOrEqual(8);
  });

  it("never puts the chooser's deck contents on shared state", () => {
    const game = makeGame([
      ...Array<string>(10).fill("Vengeful Dead"),
      ...Array<string>(30).fill("Swamp"),
    ]);
    openWith(game, 4);
    castAndAwaitChoice(game, "Distant Melody");

    // Only the chooser's legal actions carry suggestions; the decision on
    // game state — which every seat's view includes — has none.
    expect(game.state.awaiting).not.toHaveProperty("suggested");
    expect(game.legalActions(B).some((a) => a.kind === "choose-creature-type")).toBe(false);
  });

  it("is empty for a short fixed menu", () => {
    const game = makeGame();
    openWith(game, 4);
    const id = game.debugSpawn("Heraldic Banner", A, "hand");
    for (let i = 0; i < 4; i += 1) {
      const land = game.debugSpawn("Mountain", A, "battlefield");
      game.state.objects[land].tapped = false;
    }
    game.dispatch({ type: "cast-spell", player: A, card: id, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-creature-type" || s.result.over);

    const legal = game.legalActions(A).find((a) => a.kind === "choose-creature-type");
    if (legal === undefined || legal.kind !== "choose-creature-type") return;
    expect(legal.catalog).toBe(false);
    expect(legal.suggested).toEqual([]);
    expect([...legal.options]).toEqual(["W", "U", "B", "R", "G"]);
  });
});

describe("a bot choosing a creature type", () => {
  it("names its most common type rather than the first in the catalog", () => {
    const bot = new AutomaticController(A);
    const pick = bot.chooseCreatureType(
      // The view isn't consulted when suggestions are supplied.
      undefined as never,
      "obj-1" as never,
      CREATURE_TYPES,
      ["Zombie", "Angel"],
    );
    expect(pick).toBe("Zombie");
    expect(CREATURE_TYPES[0]).not.toBe("Zombie");
  });
});
