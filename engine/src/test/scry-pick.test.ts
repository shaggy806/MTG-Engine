/**
 * What a bot scries or surveils away (`scry-pick.ts`). The land rules are
 * also gate scenarios ("scries a flood land to the bottom" and its pair);
 * this pins the spell rules.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import { scryAway } from "../scry-pick.js";

const registry = createDefaultRegistry();
const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Alice's main phase with `forests` Forests out, her hand empty. */
function board(forests: number, identity: readonly ("U" | "G")[] = ["G"]): Game {
  const game = Game.create({
    seed: 3,
    registry,
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  game.state.zones.perPlayer[A].hand = [];
  game.state.players[A].commanderIdentity = [...identity];
  for (let i = 0; i < forests; i += 1) game.debugSpawn("Forest", A, "battlefield");
  return game;
}

const away = (game: Game, cards: readonly ObjectId[], mode: "scry" | "surveil" = "scry") =>
  scryAway(game.state, registry, A, cards, mode);

describe("scry and surveil picks", () => {
  it("keeps a spell within reach and sends one far beyond it away", () => {
    const game = board(3);
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const wurm = game.debugSpawn("Craw Wurm", A, "library");
    expect(away(game, [bears])).toEqual([]);
    // Six mana on three lands is three lands away: kept. Seven is past it.
    expect(away(game, [wurm])).toEqual([]);
    const titan = game.debugSpawn("Avenger of Zendikar", A, "library");
    expect(away(game, [titan])).toEqual([titan]);
  });

  it("sends a colour it can't make away sooner, unless a land for it is in hand", () => {
    const game = board(3, ["U", "G"]);
    const sphinx = game.debugSpawn("Windreader Sphinx", A, "library");
    expect(away(game, [sphinx])).toEqual([sphinx]);
    game.debugSpawn("Island", A, "hand");
    expect(away(game, [sphinx])).toEqual([]);
  });

  it("counts a land kept above a spell toward reaching it", () => {
    const game = board(3, ["U", "G"]);
    const island = game.debugSpawn("Island", A, "library");
    const sphinx = game.debugSpawn("Windreader Sphinx", A, "library");
    expect(away(game, [island, sphinx])).toEqual([]);
  });

  it("surveils a flashback card into the graveyard, but scries it nowhere", () => {
    const game = board(3);
    const flashback = game.debugSpawn("Think Twice", A, "library");
    expect(away(game, [flashback], "surveil")).toEqual([flashback]);
    expect(away(game, [flashback], "scry")).toEqual([]);
  });
});
