/**
 * Since the 2025 rules change a modal double-faced card can transform, to a
 * face that is a permanent: Kazandu Mammoth, a creature, turns over into
 * Kazandu Valley, a land — while Fell Mire can't turn into Fell the Profane,
 * a sorcery.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import { faceName } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: createDefaultRegistry(),
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
const transform = (game: Game, id: ObjectId): void => {
  const source = game.debugSpawn("Island", A, "battlefield");
  game.debugApplyEffect(A, { kind: "transform", target: 0 }, [{ kind: "object", object: id }], { source });
};

describe("a modal DFC transforms", () => {
  it("to its other face when that face is a permanent", () => {
    const game = setUp();
    const mammoth = game.debugSpawn("Kazandu Mammoth", A, "battlefield");
    transform(game, mammoth);
    expect(faceName(game.state.objects[mammoth])).toBe("Kazandu Valley");
    expect(game.characteristics(mammoth).types).toContain("land");
    transform(game, mammoth);
    expect(faceName(game.state.objects[mammoth])).toBe("Kazandu Mammoth");
  });

  it("…and not to a face that's a sorcery", () => {
    const game = setUp();
    const card = game.debugSpawn("Fell the Profane", A, "hand");
    game.dispatch({ type: "play-land", player: A, card, face: 1 });
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(faceName(game.state.objects[card])).toBe("Fell Mire");
    transform(game, card);
    expect(faceName(game.state.objects[card])).toBe("Fell Mire");
  });
});
