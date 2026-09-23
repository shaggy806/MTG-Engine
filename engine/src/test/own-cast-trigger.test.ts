/**
 * A spell on the stack has only its "when you cast this spell" abilities
 * working (rule 113.6). The spell being cast is part of the trigger scan so
 * those can fire (cascade, storm, Prossh), but that used to let *every*
 * cast trigger on the card fire for its own casting: Jhoira ("whenever you
 * cast a historic spell") drew a card off being cast, being legendary, and
 * Ms. Bumbleflower ("whenever you cast a spell") triggered off herself.
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

const setUp = (aHand: readonly string[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const castFromHand = (game: Game, name: string): void => {
  const card = game.handOf(A).find((id) => game.state.objects[id].cardName === name);
  if (card === undefined) throw new Error(`no ${name}`);
  game.dispatch({ type: "cast-spell", player: A, card });
};
const triggered = (game: Game, name: string): number =>
  game.state.eventLog.filter(
    (e) => e.type === "ability-triggered" && game.state.objects[e.source]?.cardName === name,
  ).length;

describe("a spell's own cast triggers", () => {
  it("Jhoira doesn't draw off its own (historic) casting", () => {
    const { game } = setUp(["Jhoira, Weatherlight Captain"]);
    for (const land of ["Island", "Island", "Mountain", "Mountain"]) game.debugSpawn(land, A, "battlefield");
    const hand = game.handOf(A).length;
    castFromHand(game, "Jhoira, Weatherlight Captain");
    game.advanceUntil(quiet);
    expect(triggered(game, "Jhoira, Weatherlight Captain")).toBe(0);
    expect(game.handOf(A).length).toBe(hand - 1);
  });

  it("Ms. Bumbleflower doesn't trigger off herself", () => {
    const { game } = setUp(["Ms. Bumbleflower"]);
    for (const land of ["Island", "Plains", "Forest", "Forest"]) game.debugSpawn(land, A, "battlefield");
    // Something for her trigger to target, so it would have gone on the stack.
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    castFromHand(game, "Ms. Bumbleflower");
    game.advanceUntil(quiet);
    expect(triggered(game, "Ms. Bumbleflower")).toBe(0);
  });

  it("a 'when you cast this spell' ability still fires", () => {
    const { game } = setUp(["Prossh, Skyraider of Kher"]);
    for (const land of ["Swamp", "Mountain", "Forest", "Forest", "Forest", "Forest"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    castFromHand(game, "Prossh, Skyraider of Kher");
    game.advanceUntil(quiet);
    expect(triggered(game, "Prossh, Skyraider of Kher")).toBe(1);
  });
});
