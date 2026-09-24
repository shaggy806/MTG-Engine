/**
 * Ragost, Deft Gastronaut — {R}{W} 2/2 legendary Lobster Citizen:
 *   Artifacts you control are Foods in addition to their other types and
 *   have "{2}, {T}, Sacrifice this artifact: You gain 3 life."
 *   {1}, {T}, Sacrifice a Food: Ragost deals 3 damage to each opponent.
 *   At the beginning of each end step, if you gained life this turn, untap
 *   Ragost.
 *
 * - every artifact you control is a Food (a subtype granted in layer 4), so
 *   it pays the "sacrifice a Food" cost, and has the granted life ability;
 *   an opponent's artifact is neither;
 * - the end-step untap wants life gained this turn, on anyone's end step.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const RAGOST = "Ragost, Deft Gastronaut";
const registry = createDefaultRegistry();

function makeGame(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const offers = (game: Game, source: ObjectId) =>
  game
    .legalActions(A)
    .filter(
      (x): x is Extract<LegalAction, { kind: "activate-ability" }> =>
        x.kind === "activate-ability" && x.source === source,
    );
const resolve = (game: Game) => {
  while (game.state.zones.shared.stack.length > 0) {
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
};

describe("Ragost, Deft Gastronaut", () => {
  it("is a {R}{W} 2/2 legendary Lobster Citizen", () => {
    const def = registry.get(RAGOST);
    expect(def.manaCost).toBe("{R}{W}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Lobster", "Citizen"]);
    expect([def.power, def.toughness]).toEqual([2, 2]);
    expect(identityString(colorIdentityOf(def))).toBe("WR");
  });

  it("makes your artifacts Foods with the Food ability", () => {
    const game = makeGame();
    spawn(game, RAGOST, A);
    const ring = spawn(game, "Sol Ring", A);
    const theirs = spawn(game, "Sol Ring", B);
    for (let i = 0; i < 2; i += 1) spawn(game, "Plains", A);
    expect(game.characteristics(ring).subtypes).toEqual(["Food"]);
    expect(game.characteristics(theirs).subtypes).toEqual([]);

    const food = offers(game, ring).find((x) => x.text.includes("You gain 3 life"));
    expect(food).toBeDefined();
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: ring,
      abilityIndex: food!.abilityIndex,
    });
    resolve(game);
    expect(game.state.players[A].life).toBe(23);
    expect(game.state.objects[ring].zone).toBe("graveyard");
  });

  it("sacrifices any artifact as a Food to burn each opponent", () => {
    const game = makeGame();
    const ragost = spawn(game, RAGOST, A);
    const ring = spawn(game, "Sol Ring", A);
    spawn(game, "Plains", A);
    const burn = offers(game, ragost)[0];
    expect(burn.sacrifice?.choices).toEqual([ring]);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: ragost,
      abilityIndex: burn.abilityIndex,
      sacrifice: ring,
    });
    resolve(game);
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.objects[ragost].tapped).toBe(true);
    // No life gained this turn: Ragost stays tapped through the end step.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.state.objects[ragost].tapped).toBe(true);
  });

  it("untaps at each end step if you gained life that turn", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const ragost = spawn(game, RAGOST, A);
    game.state.objects[ragost].tapped = true;
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 });
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "cleanup");
    expect(game.state.objects[ragost].tapped).toBe(false);
  });
});
