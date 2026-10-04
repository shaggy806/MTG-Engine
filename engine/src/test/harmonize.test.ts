/**
 * Harmonize (rule 702.180a): cast from a graveyard for the harmonize cost,
 * tapping up to one untapped creature you control, whose power comes off the
 * total cost's generic mana (X included, never coloured mana — the rulings);
 * a spell so cast is exiled instead of going to the graveyard. Each creature
 * it could tap is its own offer (702.180b). Zenith Festival, Nature's Rhythm.
 */
import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Wastes") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

const harmonizeOffers = (game: Game, card: ObjectId) =>
  game.legalActions(A).flatMap((a) => (a.kind === "cast-spell" && a.card === card && a.via === "harmonize" ? [a] : []));

const untapped = (game: Game, name: string): number =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name && !game.state.objects[id].tapped).length;

describe("harmonize", () => {
  it("offers a cast from the graveyard with no creature tapped, and one for each untapped creature", () => {
    const game = setUp();
    const festival = game.debugSpawn("Zenith Festival", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const tapped = game.debugSpawn("Craw Wurm", A, "battlefield");
    game.state.objects[tapped].tapped = true;
    game.debugSpawn("Hill Giant", B, "battlefield");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const taps = harmonizeOffers(game, festival).map((o) => o.harmonizeTap?.object ?? null);
    expect(taps).toEqual(expect.arrayContaining([null, giant, bears]));
    // Not a tapped creature, nor an opponent's.
    expect(taps).toHaveLength(3);
    expect(harmonizeOffers(game, festival).find((o) => o.harmonizeTap?.object === giant)?.harmonizeTap?.power).toBe(3);
  });

  it("takes the tapped creature's power off the generic cost, X included, then exiles the spell", () => {
    const game = setUp();
    const festival = game.debugSpawn("Zenith Festival", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    // {X}{R}{R} at X=4 is six mana; the Giant's 3 leaves {1}{R}{R}.
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const libraryBefore = game.state.zones.perPlayer[A].library.length;
    game.dispatch({ type: "cast-spell", player: A, card: festival, targets: [], via: "harmonize", xValue: 4, tap: [giant] });
    expect(game.state.objects[giant].tapped).toBe(true);
    expect(untapped(game, "Mountain")).toBe(0);
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].library.length).toBe(libraryBefore - 4);
    expect(game.state.objects[festival].zone).toBe("exile");
  });

  it("offers X up to what the mana pays with the creature's power off", () => {
    const game = setUp();
    const festival = game.debugSpawn("Zenith Festival", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    const elves = game.debugSpawn("Llanowar Elves", A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const maxX = (tapped: ObjectId | null) =>
      harmonizeOffers(game, festival).find((o) => (o.harmonizeTap?.object ?? null) === tapped)?.xCost?.maxX;
    // Mountains pay {R}{R}; the Forest and the Elves' {G} pay 2 generic,
    // and the Giant's 3 comes off: X=5, past the four mana sources.
    expect(maxX(giant)).toBe(5);
    // Tapping the Elves, they don't also make mana: the Forest and 1 off.
    expect(maxX(elves)).toBe(2);
    expect(maxX(null)).toBe(2);
  });

  it("never reduces the coloured part: a big creature still leaves {R}{R}", () => {
    const game = setUp();
    const festival = game.debugSpawn("Zenith Festival", A, "graveyard");
    const wurm = game.debugSpawn("Craw Wurm", A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    // One Mountain: {R}{R} can't be paid however big the creature is.
    expect(harmonizeOffers(game, festival).some((o) => o.harmonizeTap?.object === wurm)).toBe(false);
    game.debugSpawn("Mountain", A, "battlefield");
    expect(harmonizeOffers(game, festival).some((o) => o.harmonizeTap?.object === wurm)).toBe(true);
  });

  it("the creature tapped can't also tap for mana", () => {
    const game = setUp();
    const festival = game.debugSpawn("Zenith Festival", A, "graveyard");
    const elves = game.debugSpawn("Llanowar Elves", A, "battlefield", { summoningSick: false });
    game.debugSpawn("Mountain", A, "battlefield");
    // {R}{R} needs two red sources; the Elves make {G}, and they're the
    // creature tapped anyway.
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: festival, targets: [], via: "harmonize", xValue: 0, tap: [elves] }),
    ).toThrow();
  });

  it("isn't offered from the hand, where the card is cast for its mana cost", () => {
    const game = setUp();
    const festival = game.debugSpawn("Zenith Festival", A, "hand");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    game.debugSpawn("Hill Giant", A, "battlefield");
    expect(harmonizeOffers(game, festival)).toHaveLength(0);
    expect(game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === festival && a.via === undefined)).toBe(true);
  });
});

describe("Nature's Rhythm", () => {
  it("harmonized with a creature tapped, searches up a creature of mana value X or less", () => {
    const game = setUp();
    const rhythm = game.debugSpawn("Nature's Rhythm", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", A, "library");
    // {X}{G}{G}{G}{G} at X=6 is ten; the Giant's 3 leaves {3}{G}{G}{G}{G}.
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.dispatch({ type: "cast-spell", player: A, card: rhythm, targets: [], via: "harmonize", xValue: 6, tap: [giant] });
    for (let i = 0; i < 40 && !quiet(game.state); i += 1) {
      const a = game.state.awaiting;
      if (a?.kind === "choose-from-zone") game.dispatch({ type: "choose-from-zone", player: A, chosen: [wurm] });
      else if (a !== null) throw new Error(`unexpected ${a.kind}`);
      else game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
    }
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect(untapped(game, "Forest")).toBe(0);
    expect(game.state.objects[rhythm].zone).toBe("exile");
  });
});
