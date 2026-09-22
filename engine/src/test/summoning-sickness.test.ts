import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * Rule 302.6 restricts a creature's *own* {T}/{Q} abilities until it has been
 * under its controller's control since their most recent turn began, and
 * haste lifts that (702.10c). Found by the adversarial review of Kilo, Apogee
 * Mind: haste used to be ignored for tap abilities, and the rule was also
 * applied to "tap an untapped creature you control" costs, which it doesn't
 * cover.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

/** A permanent that arrived this turn. */
function arrive(game: Game, name: string, player: PlayerId): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: true });
}

function canActivate(game: Game, source: ObjectId, abilityIndex = 0): boolean {
  return game
    .legalActions(A)
    .some((a) => a.kind === "activate-ability" && a.source === source && a.abilityIndex === abilityIndex);
}

describe("summoning sickness and tap abilities", () => {
  it("a creature that just arrived can't use its own {T} ability", () => {
    const game = table();
    const krenko = arrive(game, "Krenko, Mob Boss", A);
    expect(canActivate(game, krenko)).toBe(false);
  });

  it("haste lets it, the same as attacking (Krenko under Lightning Greaves)", () => {
    const game = table();
    const krenko = arrive(game, "Krenko, Mob Boss", A);
    game.debugApplyEffect(
      A,
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      [{ kind: "object", object: krenko }],
    );
    expect(canActivate(game, krenko)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: krenko, abilityIndex: 0, targets: [] });
    expect(game.state.objects[krenko].tapped).toBe(true);
  });

  it("\"tap an untapped creature you control\" can tap one that just arrived", () => {
    const game = table();
    const settlement = game.debugSpawn("Holdout Settlement", A, "battlefield", { summoningSick: false });
    const bears = arrive(game, "Grizzly Bears", A);
    // Holdout Settlement's second ability: {T}, tap an untapped creature you
    // control: add one mana of any color. The Bears are its only creature.
    expect(canActivate(game, settlement, 1)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: settlement, abilityIndex: 1, targets: [] });
    expect(game.state.objects[bears].tapped).toBe(true);
  });
});
