/**
 * A card's supertypes in a view (rule 205.4), so the client can say
 * "Legendary" — as they apply now: a token copy "except it isn't
 * legendary" isn't.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

describe("supertypes in a view", () => {
  it("names a legendary creature legendary, in hand and on the battlefield, and a basic land basic", () => {
    const game = setUp();
    const inHand = game.debugSpawn("Krenko, Mob Boss", A, "hand");
    const onBoard = game.debugSpawn("Krenko, Mob Boss", B, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const mountain = game.debugSpawn("Mountain", A, "battlefield");
    const view = game.viewFor(A);
    expect(view.objects[inHand].supertypes).toEqual(["legendary"]);
    expect(view.objects[onBoard].supertypes).toEqual(["legendary"]);
    expect(view.objects[bears].supertypes).toEqual([]);
    expect(view.objects[mountain].supertypes).toEqual(["basic"]);
  });

  it("leaves it off a token copy made not legendary", () => {
    const game = setUp();
    const krenko = game.debugSpawn("Krenko, Mob Boss", A, "battlefield");
    game.debugApplyEffect(
      A,
      { kind: "create-token-copy", of: 0, count: 1, who: "you", notLegendary: true },
      [{ kind: "object", object: krenko }],
    );
    const copy = game.battlefield.find((id) => id !== krenko && game.state.objects[id].cardName === "Krenko, Mob Boss");
    expect(copy).toBeDefined();
    expect(game.viewFor(A).objects[copy!].supertypes).toEqual([]);
  });
});
