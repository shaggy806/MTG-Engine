/**
 * A `look-and-choose` filter that reads its source — `ofChosenType`, "a
 * creature card **of the chosen type**" (Herald's Horn's upkeep look).
 *
 * The filter used to be asked with no source, so `ofChosenType` matched
 * nothing inside a look-and-choose. It's now asked with the object whose
 * ability is resolving; and when that object has left the battlefield, with
 * the type it had chosen (rule 608.2h — last-known information), since the
 * move wiped its choice.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Alice's turn-one main phase with Herald's Horn (Bear chosen, unless
 * `chosen` says otherwise) and `top` on top of her library. */
const setUp = (top: string, chosen: string | null = "Bear") => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  const horn = game.debugSpawn("Herald's Horn", A, "battlefield");
  game.state.objects[horn].chosenCreatureType = chosen;
  const card = game.debugSpawn(top, A, "library");
  return { game, horn, card };
};

/** On to Alice's next upkeep, where the Horn's look waits for her. */
const toLook = (game: Game) => {
  game.advanceUntil(
    (s) => (s.awaiting?.kind === "choose-from-zone" && s.awaiting.player === A) || s.turn.number > 3,
  );
  const awaiting = game.state.awaiting;
  return awaiting?.kind === "choose-from-zone" ? awaiting : null;
};

const take = (game: Game, chosen: readonly ObjectId[]) =>
  game.dispatch({ type: "choose-from-zone", player: A, chosen });

describe("a look-and-choose filter of the chosen type", () => {
  it("offers a creature card of the chosen type, revealed as it's taken", () => {
    const { game, card } = setUp("Grizzly Bears");
    const awaiting = toLook(game);
    expect(awaiting?.ids).toEqual([card]);
    expect(awaiting?.eligible).toEqual([card]);
    take(game, [card]);
    expect(game.state.zones.perPlayer[A].hand).toContain(card);
    expect(game.state.revealedThisTurn).toContain(card);
  });

  it("offers nothing when the card is another creature type", () => {
    const { game, card } = setUp("Llanowar Elves");
    const awaiting = toLook(game);
    expect(awaiting?.ids).toEqual([card]);
    expect(awaiting?.eligible).toEqual([]);
    take(game, []);
    // It stays on top, unrevealed (the ruling).
    expect(game.state.zones.perPlayer[A].library[0]).toBe(card);
    expect(game.state.revealedThisTurn).not.toContain(card);
  });

  it("offers nothing with no type chosen, though the look still happens", () => {
    const { game, card } = setUp("Grizzly Bears", null);
    const awaiting = toLook(game);
    expect(awaiting?.ids).toEqual([card]);
    expect(awaiting?.eligible).toEqual([]);
  });

  it("reads the type the source had when it has left before its ability resolves (608.2h)", () => {
    const { game, horn, card } = setUp("Grizzly Bears");
    game.advanceUntil(
      (s) => s.turn.number === 3 && s.turn.step === "upkeep" && s.zones.shared.stack.length > 0,
    );
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: horn }]);
    expect(game.state.zones.perPlayer[A].graveyard).toContain(horn);
    expect(game.state.objects[horn].chosenCreatureType).toBeNull();
    const awaiting = toLook(game);
    expect(awaiting?.eligible).toEqual([card]);
  });
});
