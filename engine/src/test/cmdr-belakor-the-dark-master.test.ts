/**
 * Be'lakor, the Dark Master: "you draw X cards and you lose X life, where X
 * is the number of Demons you control" as it enters, and "whenever another
 * Demon you control enters, it deals damage equal to its power to any
 * target" — damage *from* the entering Demon (`from: "trigger-object"`). The
 * Demon's lifelink and last-known power are covered in
 * `damage-trigger-extensions.test.ts`.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const BELAKOR = "Be'lakor, the Dark Master";

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("Be'lakor, the Dark Master", () => {
  it("Prince of Chaos draws and loses one per Demon you control, itself included", () => {
    const { game } = setUp();
    game.debugSpawn("Bloodgift Demon", A);
    game.debugSpawn("Bloodgift Demon", B);
    const before = game.handOf(A).length;
    game.debugSpawn(BELAKOR, A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(before + 2);
    expect(game.state.players[A].life).toBe(18);
  });

  it("Lord of Torment: another Demon entering deals its power to any target; Be'lakor itself doesn't", () => {
    const { game, a } = setUp();
    game.debugSpawn(BELAKOR, A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(20);
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    const demon = game.debugSpawn("Bloodgift Demon", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(15);
    const hit = game.state.eventLog.find((e) => e.type === "damage-dealt" && e.target.kind === "player");
    expect(hit?.type === "damage-dealt" && hit.source).toBe(demon);
  });

  it("an opponent's Demon entering doesn't trigger it", () => {
    const { game } = setUp();
    game.debugSpawn(BELAKOR, A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const life = game.state.players[A].life;
    game.debugSpawn("Bloodgift Demon", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(life);
    expect(game.state.players[B].life).toBe(20);
  });
});
