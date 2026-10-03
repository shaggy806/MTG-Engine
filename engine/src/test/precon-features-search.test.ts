/**
 * The cards behind the zone-choice features: Myriad Landscape and Krosan
 * Verge (a search's `together` — `zone-choice-together.test.ts`) and Herald's
 * Horn (a look-and-choose filter that reads its source's chosen type —
 * `zone-choice-source.test.ts`). Each clause of each card, as printed.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = (library: readonly string[] = Array<string>(40).fill("Swamp")) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: library },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });

const mainOf = (game: Game, player: PlayerId) =>
  game.advanceUntil((s) => s.priority.holder === player && s.turn.step === "precombat-main");

const untapped = (game: Game, name: string, player: PlayerId): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield");
  game.state.objects[id].tapped = false;
  return id;
};

const canCast = (game: Game, player: PlayerId, card: ObjectId) =>
  game.legalActions(player).some((a) => a.kind === "cast-spell" && a.card === card);

describe.each(["Myriad Landscape", "Krosan Verge"])("%s", (name) => {
  it("enters tapped and taps for {C}", () => {
    const game = makeGame();
    mainOf(game, A);
    const land = game.debugSpawn(name, A, "hand");
    game.dispatch({ type: "play-land", player: A, card: land });
    expect(game.state.objects[land].tapped).toBe(true);
    game.state.objects[land].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: land, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.map((unit) => unit.type)).toEqual(["C"]);
  });

  it("costs {2}, {T} and itself to search, and can't be cracked without the {2}", () => {
    const game = makeGame();
    mainOf(game, A);
    const land = untapped(game, name, A);
    const crack = () =>
      game.legalActions(A).some((a) => a.kind === "activate-ability" && a.source === land && a.abilityIndex === 1);
    expect(crack()).toBe(false);
    untapped(game, "Swamp", A);
    untapped(game, "Swamp", A);
    expect(crack()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: land, abilityIndex: 1 });
    expect(game.state.zones.perPlayer[A].graveyard).toContain(land);
  });
});

describe("Myriad Landscape", () => {
  it("finds two basic lands that share a land type, tapped, and shuffles", () => {
    const game = makeGame([...Array<string>(10).fill("Swamp"), "Island", "Island", "Forest", ...Array<string>(27).fill("Swamp")]);
    mainOf(game, A);
    const land = untapped(game, "Myriad Landscape", A);
    untapped(game, "Swamp", A);
    untapped(game, "Swamp", A);
    game.dispatch({ type: "activate-ability", player: A, source: land, abilityIndex: 1 });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const library = game.state.zones.perPlayer[A].library;
    const islands = library.filter((id) => game.state.objects[id].cardName === "Island");
    const [forest] = library.filter((id) => game.state.objects[id].cardName === "Forest");
    expect(() => game.dispatch({ type: "choose-from-zone", player: A, chosen: [islands[0], forest] })).toThrow();
    const events = game.events.length;
    game.dispatch({ type: "choose-from-zone", player: A, chosen: islands });
    for (const id of islands) expect(game.state.objects[id].tapped).toBe(true);
    expect(game.events.slice(events).some((e) => e.type === "library-shuffled")).toBe(true);
  });
});

describe("Krosan Verge", () => {
  it("finds a Forest card and a Plains card, tapped", () => {
    const game = makeGame([...Array<string>(10).fill("Swamp"), "Forest", "Plains", "Forest", ...Array<string>(27).fill("Swamp")]);
    mainOf(game, A);
    const land = untapped(game, "Krosan Verge", A);
    untapped(game, "Swamp", A);
    untapped(game, "Swamp", A);
    game.dispatch({ type: "activate-ability", player: A, source: land, abilityIndex: 1 });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-from-zone" ? awaiting.eligible.length : 0).toBe(3);
    const library = game.state.zones.perPlayer[A].library;
    const forests = library.filter((id) => game.state.objects[id].cardName === "Forest");
    const [plains] = library.filter((id) => game.state.objects[id].cardName === "Plains");
    expect(() => game.dispatch({ type: "choose-from-zone", player: A, chosen: forests })).toThrow();
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [forests[0], plains] });
    for (const id of [forests[0], plains]) {
      expect(game.state.zones.shared.battlefield).toContain(id);
      expect(game.state.objects[id].tapped).toBe(true);
    }
  });
});

describe("Herald's Horn", () => {
  it("asks for a creature type as it enters", () => {
    const game = makeGame();
    mainOf(game, A);
    for (let i = 0; i < 3; i += 1) untapped(game, "Swamp", A);
    const horn = game.debugSpawn("Herald's Horn", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: horn, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-creature-type" || s.result.over);
    expect(game.state.awaiting?.kind).toBe("choose-creature-type");
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Bear" });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(game.state.objects[horn].chosenCreatureType).toBe("Bear");
  });

  it("takes {1} off creature spells of the chosen type its controller casts — and only those", () => {
    const game = makeGame();
    mainOf(game, A);
    const horn = game.debugSpawn("Herald's Horn", A, "battlefield");
    untapped(game, "Forest", A);
    const bears = game.debugSpawn("Grizzly Bears", A, "hand"); // {1}{G} Bear
    const centaur = game.debugSpawn("Centaur Courser", A, "hand"); // {2}{G} Centaur
    game.state.objects[horn].chosenCreatureType = "Bear";
    expect(canCast(game, A, bears)).toBe(true);
    expect(canCast(game, A, centaur)).toBe(false);
    game.state.objects[horn].chosenCreatureType = null;
    expect(canCast(game, A, bears)).toBe(false);
  });

  it("doesn't discount an opponent's spells", () => {
    const game = makeGame();
    mainOf(game, A);
    const horn = game.debugSpawn("Herald's Horn", A, "battlefield");
    game.state.objects[horn].chosenCreatureType = "Bear";
    mainOf(game, B);
    untapped(game, "Forest", B);
    const bears = game.debugSpawn("Grizzly Bears", B, "hand");
    expect(canCast(game, B, bears)).toBe(false);
  });

  it("puts a creature card of the chosen type from the top into its controller's hand at upkeep", () => {
    const game = makeGame();
    mainOf(game, A);
    const horn = game.debugSpawn("Herald's Horn", A, "battlefield");
    game.state.objects[horn].chosenCreatureType = "Bear";
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || s.turn.number > 3);
    expect(game.state.turn.step).toBe("upkeep");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [bears] });
    expect(game.state.zones.perPlayer[A].hand).toContain(bears);
  });
});
