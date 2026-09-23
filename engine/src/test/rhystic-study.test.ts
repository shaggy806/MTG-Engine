/**
 * Rhystic Study — "Whenever an opponent casts a spell, you may draw a card
 * unless that player pays {1}."
 *
 * The caster decides whether to pay; the draw, if they don't, is Rhystic
 * Study's controller's, and it's a "may": they can decline it. Before the
 * `unless` fix a caster who declined to pay drew the card themselves.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: ["Grizzly Bears", ...Array<string>(40).fill("Forest")] },
    ],
  });
  game.debugSpawn("Rhystic Study", A, "battlefield");
  for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", B, "battlefield");
  game.advanceUntil(
    (s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B,
  );
  const bears = game.handOf(B).find((id) => game.state.objects[id].cardName === "Grizzly Bears");
  if (bears === undefined) throw new Error("no Bears");
  game.dispatch({ type: "cast-spell", player: B, card: bears });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("Rhystic Study", () => {
  it("asks the caster, and if they won't pay, its controller may draw", () => {
    const { game, a } = setUp();
    expect(game.state.awaiting?.player).toBe(B);
    const [aHand, bHand] = [game.handOf(A).length, game.handOf(B).length];
    a.chooseModesFn = () => [0];
    game.dispatch({ type: "choose-modes", player: B, modes: [] });
    // Now Alice is asked whether to draw.
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    expect(game.state.awaiting?.player).toBe(A);
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(aHand + 1);
    expect(game.handOf(B).length).toBe(bHand);
  });

  it("its controller may decline the draw", () => {
    const { game, a } = setUp();
    const aHand = game.handOf(A).length;
    a.chooseModesFn = () => [];
    game.dispatch({ type: "choose-modes", player: B, modes: [] });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(aHand);
  });

  it("draws nothing when the caster pays", () => {
    const { game } = setUp();
    const aHand = game.handOf(A).length;
    game.dispatch({ type: "choose-modes", player: B, modes: [0] });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(aHand);
  });
});
