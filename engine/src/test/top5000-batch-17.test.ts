/**
 * Top-5000 batch 17 (ranks 2185–2243, a short batch). No new engine
 * vocabulary; these pin a mass bounce whose toughness bound is read off the
 * board (Scourge of Fleets) and a token count that grows with a counter
 * (Assemble the Legion).
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const tokens = (game: Game, name: string): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === name)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("top-5000 batch 17 — Scourge of Fleets", () => {
  it("bounces opponents' creatures with toughness up to your Island count", () => {
    const game = setUp();
    spawn(game, "Island");
    spawn(game, "Island");
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const mine = spawn(game, "Grizzly Bears");
    game.debugSpawn("Scourge of Fleets", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(zone(game, bears)).toBe("hand");
    expect(zone(game, giant)).toBe("battlefield");
    expect(zone(game, mine)).toBe("battlefield");
  });
});

describe("top-5000 batch 17 — Assemble the Legion", () => {
  it("makes one more Soldier each upkeep", () => {
    const game = setUp();
    spawn(game, "Assemble the Legion");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(tokens(game, "Red-White Soldier Token")).toBe(1);
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "precombat-main");
    expect(tokens(game, "Red-White Soldier Token")).toBe(3);
  });
});
