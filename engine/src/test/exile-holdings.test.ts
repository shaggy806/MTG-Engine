import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

// `VisibleObject.holding`: the cards in exile linked to a permanent, so a
// client can show what a Banishing Light is holding (rule 720.2) or what a
// Theater of Horrors has exiled to be played — a face-down one by id only.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (game: Game) =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0);
const holdingOf = (game: Game, id: ObjectId, viewer = B) => game.viewFor(viewer).objects[id]?.holding;

describe("what a permanent holds in exile", () => {
  it("a Banishing Light holds what it exiled, for every seat, until it leaves", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const light = game.debugSpawn("Banishing Light", A, "battlefield", { announceEntry: true });
    quiet(game);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(holdingOf(game, light, A)).toEqual([bears]);
    expect(holdingOf(game, light, B)).toEqual([bears]);

    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: light }]);
    quiet(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.viewFor(B).objects[light]?.holding).toBeUndefined();
  });

  it("a permanent that holds nothing has no list", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(holdingOf(game, bears)).toBeUndefined();
  });

  it("cards exiled with a source that lets them be played — face down ones by id only", () => {
    const game = setUp();
    const maralen = game.debugSpawn("Maralen, Fae Ascendant", A, "battlefield");
    const [top, second] = game.state.zones.perPlayer[B].library;
    game.debugApplyEffect(
      A,
      { kind: "impulse-exile", amount: 2, whose: "each-opponent", duration: "end-of-turn", whileSource: true, faceDown: true },
      [],
      { source: maralen },
    );
    expect(holdingOf(game, maralen, B)).toEqual([top, second]);
    // Listed, but Bob can't see what they are (rule 406.3); Alice can.
    expect(game.viewFor(B).objects[top]).toBeUndefined();
    expect(game.viewFor(A).objects[top]?.cardName).toBe("Island");

    // Flickered, Maralen is a new object (rule 400.7): no longer linked.
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: maralen }]);
    expect(holdingOf(game, maralen, A)).toBeUndefined();
  });
});
