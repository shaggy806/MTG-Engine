/**
 * Exiling cards from the top of a library (`exile-from-library`): the top N
 * of your own, or all but the bottom card of target player's — Nicol Bolas,
 * the Arisen's "exile all but the bottom card of target player's library".
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Bob's library after his opening seven: 32 Islands with a Forest at the
 * bottom. */
const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: [...Array<string>(39).fill("Island"), "Forest"] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

describe("exile from the top of a library", () => {
  it("all but the bottom card of target player's library", () => {
    const game = setUp();
    const before = game.state.zones.perPlayer[B].library.length;
    game.debugApplyEffect(A, { kind: "exile-from-library", whose: 0, allBut: 1 }, [
      { kind: "player", player: B },
    ]);
    const library = game.state.zones.perPlayer[B].library;
    expect(library.map((id) => game.state.objects[id].cardName)).toEqual(["Forest"]);
    expect(
      game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === B),
    ).toHaveLength(before - 1);
  });

  it("the top N of your own, counted as exiled this way", () => {
    const game = setUp();
    const before = game.state.zones.perPlayer[A].library.length;
    game.debugApplyEffect(A, {
      kind: "sequence",
      effects: [
        { kind: "exile-from-library", amount: 3 },
        { kind: "gain-life", amount: { thisWay: "exiled" } },
      ],
    });
    expect(game.state.zones.perPlayer[A].library).toHaveLength(before - 3);
    expect(game.state.players[A].life).toBe(23);
  });

  it("more than the library holds exiles what there is", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "exile-from-library", whose: 0, amount: 99 }, [
      { kind: "player", player: B },
    ]);
    expect(game.state.zones.perPlayer[B].library).toHaveLength(0);
    expect(game.state.result.over).toBe(false);
  });
});
