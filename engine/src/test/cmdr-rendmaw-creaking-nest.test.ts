/**
 * Rendmaw, Creaking Nest — {3}{B}{G} legendary 5/5 artifact creature —
 * Scarecrow.
 *
 *   Reach, menace
 *   When Rendmaw enters and whenever you play a card with two or more card
 *   types, each player creates a tapped 2/2 black Bird creature token with
 *   flying. The tokens are goaded for the rest of the game.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { goadersOf } from "../goad.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();
const RENDMAW = "Rendmaw, Creaking Nest";
const BIRD = "2/2 Black Bird Token";

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
const birdsOf = (game: Game, player: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => {
    const o = game.state.objects[id];
    return o.cardName === BIRD && o.controller === player;
  });
const birdCounts = (game: Game): [number, number] => [birdsOf(game, A).length, birdsOf(game, B).length];
/** `player` plays `name` from their hand — a land (Dryad Arbor too), or a
 * spell they then let resolve. */
const play = (game: Game, name: string, player: PlayerId = A): void => {
  const card = game.debugSpawn(name, player, "hand");
  if (registry.get(name).types.includes("land")) game.dispatch({ type: "play-land", player, card });
  else game.dispatch({ type: "cast-spell", player, card });
  game.advanceUntil(quiet);
};

describe("Rendmaw, Creaking Nest", () => {
  it("entering, gives each player a tapped 2/2 flying Bird, goaded by Rendmaw's controller for the game", () => {
    const game = setUp();
    game.debugSpawn(RENDMAW, A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(birdCounts(game)).toEqual([1, 1]);
    for (const id of [...birdsOf(game, A), ...birdsOf(game, B)]) {
      const c = game.characteristics(id);
      expect([c.power, c.toughness]).toEqual([2, 2]);
      expect(c.keywords.has("flying")).toBe(true);
      expect(c.colors.has("B")).toBe(true);
      expect(game.state.objects[id].tapped).toBe(true);
      expect(game.state.objects[id].goadedForGameBy).toEqual([A]);
      expect(goadersOf(game.state, registry, id)).toContain(A);
    }
  });

  it("a spell with two card types makes more Birds; a spell with one doesn't", () => {
    const game = setUp();
    game.debugSpawn(RENDMAW, A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    play(game, "Memnite");
    expect(birdCounts(game)).toEqual([1, 1]);
    play(game, "Opt");
    expect(birdCounts(game)).toEqual([1, 1]);
  });

  it("a land with two card types counts as a card played; a basic land doesn't", () => {
    const game = setUp();
    game.debugSpawn(RENDMAW, A, "battlefield");
    play(game, "Seat of the Synod");
    expect(birdCounts(game)).toEqual([1, 1]);
    play(game, "Dryad Arbor");
    expect(birdCounts(game)).toEqual([2, 2]);
    play(game, "Island");
    expect(birdCounts(game)).toEqual([2, 2]);
  });

  it("an opponent's play doesn't count", () => {
    const game = setUp();
    game.debugSpawn(RENDMAW, A, "battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    play(game, "Memnite", B);
    play(game, "Seat of the Synod", B);
    expect(birdCounts(game)).toEqual([0, 0]);
  });
});
