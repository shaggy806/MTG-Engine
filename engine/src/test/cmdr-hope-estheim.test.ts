/**
 * Hope Estheim: lifelink, and at the beginning of your end step each opponent
 * mills X, where X is the life you gained this turn — a scoped `mill` whose
 * amount is the `life-gained` turn stat, read as the trigger resolves.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const HOPE = "Hope Estheim";

const setUp = () => {
  const players = [A, B, C];
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a: controllers[A] as ScriptedController };
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const milled = (game: Game, p: PlayerId): number => game.state.zones.perPlayer[p].graveyard.length;
const pastEndStep = (s: GameState): boolean => s.turn.number === 2;

describe("Hope Estheim", () => {
  it("each opponent mills the life you gained this turn — lifelink combat damage included", () => {
    const { game, a } = setUp();
    const hope = spawn(game, HOPE);
    a.declareAttackersFn = () => [{ attacker: hope, defender: B }];
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    game.advanceUntil(pastEndStep);
    // 3 from the effect, 2 from Hope's own lifelink hit.
    expect(game.state.players[A].life).toBe(25);
    expect(milled(game, B)).toBe(5);
    expect(milled(game, C)).toBe(5);
    expect(milled(game, A)).toBe(0);
  });

  it("mills nothing on a turn you gained no life, and only on your own end step", () => {
    const { game } = setUp();
    spawn(game, HOPE);
    game.advanceUntil(pastEndStep);
    expect(milled(game, B) + milled(game, C)).toBe(0);
    // Bob's turn: Alice gains life, but it isn't her end step.
    game.debugApplyEffect(A, { kind: "gain-life", amount: 4 });
    game.advanceUntil((s) => s.turn.number === 3);
    expect(milled(game, B) + milled(game, C)).toBe(0);
  });
});
