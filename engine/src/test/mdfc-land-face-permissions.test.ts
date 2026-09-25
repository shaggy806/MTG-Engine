/**
 * A permission to play lands from a zone reaches a modal double-faced card's
 * land face, though off the battlefield the card is only its front (rule
 * 712.8a): Ancient Greenwarden's ruling, and Ramunap Excavator, Crucible of
 * Worlds and Oracle of Mul Daya the same way. An "impulse" play permission
 * reaches either face.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

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

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const landOffers = (game: Game, card: ObjectId) =>
  game.legalActions(A).filter((x) => x.kind === "play-land" && x.card === card);

describe("Ancient Greenwarden", () => {
  it("plays a modal double-faced card's land face from the graveyard", () => {
    const game = setUp();
    spawn(game, "Ancient Greenwarden");
    const trawler = game.debugSpawn("Boggart Trawler", A, "graveyard");
    const offers = landOffers(game, trawler);
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({ kind: "play-land", face: 1, cardName: "Boggart Bog" });
    game.dispatch({ type: "play-land", player: A, card: trawler, face: 1 });
    expect(game.state.objects[trawler].zone).toBe("battlefield");
    expect(game.state.objects[trawler].face).toBe(1);
    // Its nonland face can't be cast from there.
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === trawler)).toBe(false);
  });

  it("a land entering makes a landfall trigger twice, and playing it isn't a separate cause", () => {
    const game = setUp();
    spawn(game, "Ancient Greenwarden");
    spawn(game, "Jaddi Offshoot");
    const forest = game.debugSpawn("Forest", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: forest });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(22);
  });
});

describe("the same permission elsewhere", () => {
  it("Ramunap Excavator: the land face, not the front", () => {
    const game = setUp();
    spawn(game, "Ramunap Excavator");
    const trawler = game.debugSpawn("Boggart Trawler", A, "graveyard");
    expect(landOffers(game, trawler)).toMatchObject([{ face: 1 }]);
  });

  it("Oracle of Mul Daya: a land face on top of the library", () => {
    const game = setUp();
    spawn(game, "Oracle of Mul Daya");
    const trawler = game.debugSpawn("Boggart Trawler", A, "library");
    expect(game.state.zones.perPlayer[A].library[0]).toBe(trawler);
    expect(landOffers(game, trawler)).toMatchObject([{ face: 1 }]);
  });

  it("without a permission, nothing is offered", () => {
    const game = setUp();
    const trawler = game.debugSpawn("Boggart Trawler", A, "graveyard");
    expect(landOffers(game, trawler)).toHaveLength(0);
  });
});
