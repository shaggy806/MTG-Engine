/**
 * Generic mana is paid from the sources the rest of the hand needs least
 * (`ManaPlanningView.keep`, `Game.colorsWanted`).
 *
 * A bug report (2026-10-06): with Mountain, Karplusan Forest, two Islands, a
 * Forest and a Mountain untapped, casting Fervor ({2}{R}) tapped a Mountain
 * and both Islands, and Roiling Dragonstorm ({1}{U}) in hand couldn't be
 * cast. The solver paid generic mana in battlefield order.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

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
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  game.state.zones.perPlayer[A].hand = [];
  return game;
};

const land = (game: Game, name: string): ObjectId => {
  const id = game.debugSpawn(name, A, "battlefield", { summoningSick: false });
  game.state.objects[id].tapped = false;
  return id;
};

describe("generic mana from the sources the hand needs least", () => {
  it("Fervor leaves an Island for Roiling Dragonstorm", () => {
    const game = setUp();
    for (const id of game.battlefield) if (game.state.objects[id].controller === A) game.state.objects[id].tapped = true;
    land(game, "Mountain");
    land(game, "Karplusan Forest");
    const islands = [land(game, "Island"), land(game, "Island")];
    land(game, "Forest");
    land(game, "Mountain");
    const fervor = game.debugSpawn("Fervor", A, "hand");
    game.debugSpawn("Roiling Dragonstorm", A, "hand");
    game.debugSpawn("Balefire Dragon", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: fervor, targets: [] });
    expect(islands.some((id) => !game.state.objects[id].tapped)).toBe(true);
  });

  it("a card it can't cast with what's left doesn't hold its colour back", () => {
    // The user's refinement: only spells castable after this payment count.
    // Fervor out of five lands leaves two; The Unspeakable costs nine, so its
    // {U}{U}{U} holds no Island back, and generic mana is paid in list order
    // — the Islands — as it was before any of this.
    const game = setUp();
    for (const id of game.battlefield) if (game.state.objects[id].controller === A) game.state.objects[id].tapped = true;
    land(game, "Mountain");
    const islands = [land(game, "Island"), land(game, "Island")];
    const forest = land(game, "Forest");
    land(game, "Mountain");
    const fervor = game.debugSpawn("Fervor", A, "hand");
    game.debugSpawn("The Unspeakable", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: fervor, targets: [] });
    expect(islands.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(game.state.objects[forest].tapped).toBe(false);
  });

  it("with nothing else in hand, pays as before", () => {
    const game = setUp();
    for (const id of game.battlefield) if (game.state.objects[id].controller === A) game.state.objects[id].tapped = true;
    land(game, "Mountain");
    land(game, "Island");
    land(game, "Island");
    const fervor = game.debugSpawn("Fervor", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: fervor, targets: [] });
    expect(game.state.zones.shared.stack).toContain(fervor);
  });
});

/**
 * A bug report (2026-10-06): with Sol Ring untapped and nothing else in hand,
 * casting Arcane Signet ({2}) tapped a Mountain and Temple of Abandon. With
 * no other card to weigh the colours against, generic mana was paid in the
 * order `Game.manaSources` lists sources, lands first.
 */
describe("generic mana from colourless sources first", () => {
  it("Arcane Signet is paid with Sol Ring, not two coloured lands", () => {
    const game = setUp();
    for (const id of game.battlefield) if (game.state.objects[id].controller === A) game.state.objects[id].tapped = true;
    const lands = [land(game, "Mountain"), land(game, "Temple of Abandon")];
    const solRing = land(game, "Sol Ring");
    const signet = game.debugSpawn("Arcane Signet", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: signet, targets: [] });
    expect(game.state.objects[solRing].tapped).toBe(true);
    expect(lands.map((id) => game.state.objects[id].tapped)).toEqual([false, false]);
  });

  it("a colourless mana creature still waits for the lands, so it can attack", () => {
    const game = setUp();
    for (const id of game.battlefield) if (game.state.objects[id].controller === A) game.state.objects[id].tapped = true;
    const lands = [land(game, "Mountain"), land(game, "Temple of Abandon")];
    const myr = land(game, "Palladium Myr");
    const signet = game.debugSpawn("Arcane Signet", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: signet, targets: [] });
    expect(game.state.objects[myr].tapped).toBe(false);
    expect(lands.map((id) => game.state.objects[id].tapped)).toEqual([true, true]);
  });
});

/**
 * A live bot misplay (2026-10-07): with three Forests, two Islands and two
 * Mountains, Urza's Incubator's {3} tapped all three Forests, and Miirym,
 * Sentinel Wyrm ({3}{G}{U}{R}, {2} less naming Dragon) couldn't follow it.
 * Two halves: each source was scored against the whole supply of its colour,
 * not what this payment leaves of it, so every Forest scored lowest; and a
 * card the spell being paid for makes cheaper was weighed at its printed cost,
 * which the mana left can't reach.
 */
describe("generic mana leaves a source of each colour the hand still needs", () => {
  const board = (game: Game) => {
    for (const id of game.battlefield) if (game.state.objects[id].controller === A) game.state.objects[id].tapped = true;
    return {
      forests: [land(game, "Forest"), land(game, "Forest"), land(game, "Forest")],
      islands: [land(game, "Island"), land(game, "Island")],
      mountains: [land(game, "Mountain"), land(game, "Mountain")],
    };
  };
  const untapped = (game: Game, ids: readonly ObjectId[]) => ids.filter((id) => !game.state.objects[id].tapped).length;

  it("Commander's Sphere leaves a Forest, an Island and a Mountain for Animar", () => {
    const game = setUp();
    const { forests, islands, mountains } = board(game);
    const sphere = game.debugSpawn("Commander's Sphere", A, "hand");
    game.debugSpawn("Animar, Soul of Elements", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: sphere, targets: [] });
    expect(game.state.zones.shared.stack).toContain(sphere);
    expect([untapped(game, forests), untapped(game, islands), untapped(game, mountains)].every((n) => n > 0)).toBe(true);
  });

  it("Urza's Incubator leaves the colours Miirym needs at its reduced cost", () => {
    const game = setUp();
    const { forests, islands, mountains } = board(game);
    const incubator = game.debugSpawn("Urza's Incubator", A, "hand");
    game.debugSpawn("Miirym, Sentinel Wyrm", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: incubator, targets: [] });
    expect(game.state.zones.shared.stack).toContain(incubator);
    expect([untapped(game, forests), untapped(game, islands), untapped(game, mountains)].every((n) => n > 0)).toBe(true);
  });
});
