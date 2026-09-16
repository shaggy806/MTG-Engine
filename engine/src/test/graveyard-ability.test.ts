/**
 * `ActivatedAbility.zone: "graveyard"` — "Exile this card from your graveyard:
 * [effect]" (Runehorn Hellkite), the sibling of Channel's `zone: "hand"`.
 *
 * The zone-change is part of the *cost*, so it happens on activation rather
 * than on resolution and stands even if the ability never resolves.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });

/** Give A enough untapped Mountains to pay {5}{R}. */
const withMana = (game: Game, n = 6) => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn("Mountain", A, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

const findGraveyardAbility = (game: Game) =>
  game
    .legalActions(A)
    .find((a) => a.kind === "activate-ability" && a.cardName === "Runehorn Hellkite");

describe("abilities activated from the graveyard", () => {
  it("is offered while the card is in the graveyard", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    withMana(game);
    game.debugSpawn("Runehorn Hellkite", A, "graveyard");
    expect(findGraveyardAbility(game)).toBeDefined();
  });

  it("is not offered from the battlefield or from hand", () => {
    for (const zone of ["battlefield", "hand"] as const) {
      const game = makeGame();
      game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
      withMana(game);
      game.debugSpawn("Runehorn Hellkite", A, zone);
      expect(findGraveyardAbility(game)).toBeUndefined();
    }
  });

  it("exiles the source as a cost and refills every hand", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    withMana(game);
    const card = game.debugSpawn("Runehorn Hellkite", A, "graveyard");

    const legal = findGraveyardAbility(game);
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "activate-ability") return;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: [],
    });

    // The exile is a cost, so it has already happened with the ability still
    // on the stack.
    expect(game.state.objects[card].zone).toBe("exile");

    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(7);
    expect(game.state.zones.perPlayer[B].hand.length).toBe(7);
  });

  it("is not offered without the mana to pay for it", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    withMana(game, 2);
    game.debugSpawn("Runehorn Hellkite", A, "graveyard");
    expect(findGraveyardAbility(game)).toBeUndefined();
  });
});
