/**
 * "Add three mana of any one color" (Gilded Lotus, Lotus Field, Loot, the
 * Pathfinder) is three mana of a single colour: the auto-payer offers a
 * whole colour at a time, and a hand activation makes all three of the one
 * picked.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

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
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const castable = (game: Game, card: ObjectId) =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("Gilded Lotus", () => {
  it("pays three of one colour, never three colours", () => {
    const game = setUp();
    spawn(game, "Gilded Lotus");
    const charm = game.debugSpawn("Esper Charm", A, "hand");
    const adept = game.debugSpawn("Aether Adept", A, "hand");
    expect(castable(game, charm)).toBe(false);
    expect(castable(game, adept)).toBe(true);
  });

  it("tapped by hand, makes three of the colour picked", () => {
    const game = setUp();
    const lotus = spawn(game, "Gilded Lotus");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: lotus,
      abilityIndex: 0,
      targets: [],
      manaColors: ["B", "U", "W"],
    });
    const pool = poolCounts(game.state.players[A].manaPool);
    expect(pool.B).toBe(3);
    expect(pool.U).toBe(0);
    expect(pool.W).toBe(0);
  });
});
