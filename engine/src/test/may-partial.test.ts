/**
 * A "you may" is offered only when its action can be done in full: a player
 * can't choose to mill more cards than their library holds (rule 701.17b,
 * Daggerfang Duo's ruling), nor to discard a card with an empty hand and draw
 * for it (Rydia, Summoner of Mist).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const enters = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });

describe("Daggerfang Duo", () => {
  it("with one card left, isn't offered the mill", () => {
    const { game, a } = setUp();
    const library = game.state.zones.perPlayer[A].library;
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: library.length - 1 }, []);
    expect(game.state.zones.perPlayer[A].library).toHaveLength(1);
    let asked = false;
    a.chooseModesFn = () => {
      asked = true;
      return [0];
    };
    enters(game, "Daggerfang Duo");
    game.advanceUntil(quiet);
    expect(asked).toBe(false);
    expect(game.state.zones.perPlayer[A].library).toHaveLength(1);
  });

  it("with two or more, mills two when asked to", () => {
    const { game, a } = setUp();
    const before = game.state.zones.perPlayer[A].library.length;
    a.chooseModesFn = () => [0];
    enters(game, "Daggerfang Duo");
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].library).toHaveLength(before - 2);
  });
});

describe("Rydia, Summoner of Mist's landfall", () => {
  it("draws nothing with no card to discard", () => {
    const { game, a } = setUp();
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" }, []);
    expect(game.handOf(A)).toHaveLength(0);
    let asked = false;
    a.chooseModesFn = () => {
      asked = true;
      return [0];
    };
    enters(game, "Rydia, Summoner of Mist");
    enters(game, "Forest");
    game.advanceUntil(quiet);
    expect(asked).toBe(false);
    expect(game.handOf(A)).toHaveLength(0);
  });

  it("loots when there's a card to discard", () => {
    const { game, a } = setUp();
    const hand = game.handOf(A).length;
    const drawn = game.state.eventLog.filter((e) => e.type === "card-drawn").length;
    a.chooseModesFn = () => [0];
    enters(game, "Rydia, Summoner of Mist");
    enters(game, "Forest");
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(hand);
    expect(game.state.eventLog.filter((e) => e.type === "card-drawn").length).toBe(drawn + 1);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(1);
  });
});
