/**
 * Suspend asks whether the card could be cast (rule 702.62a): a player who
 * can't cast spells can't suspend one either (Silence's ruling).
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
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
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

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

describe("Silence", () => {
  it("stops opponents casting spells this turn, and not its caster", () => {
    const game = setUp();
    spawn(game, "Plains");
    const silence = game.debugSpawn("Silence", A, "hand");
    const opt = game.debugSpawn("Opt", B, "hand");
    spawn(game, "Island", B);
    game.dispatch({ type: "cast-spell", player: A, card: silence, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[silence].zone).toBe("graveyard");
    // Alice passes; Bob has priority with an empty stack and can't cast Opt.
    game.dispatch({ type: "pass-priority", player: A });
    expect(game.state.priority.holder).toBe(B);
    expect(game.legalActions(B).some((x) => x.kind === "cast-spell" && x.card === opt)).toBe(false);
    expect(() => game.dispatch({ type: "cast-spell", player: B, card: opt, targets: [] })).toThrow(/can't cast/);
    // Alice may still cast spells.
    spawn(game, "Island");
    const mine = game.debugSpawn("Opt", A, "hand");
    game.dispatch({ type: "pass-priority", player: B });
    game.advanceUntil((s) => s.priority.holder === A);
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === mine)).toBe(true);
  });

  it("a player who can't cast spells can't suspend a card", () => {
    const game = setUp();
    spawn(game, "Mountain");
    const bolt = game.debugSpawn("Rift Bolt", A, "hand");
    expect(game.legalActions(A).some((x) => x.kind === "suspend" && x.card === bolt)).toBe(true);
    // Bob's Silence, as it resolves.
    const effect = registry.get("Silence").effect;
    if (effect === null) throw new Error("Silence has no effect");
    game.debugApplyEffect(B, effect, []);
    expect(game.legalActions(A).some((x) => x.kind === "suspend" && x.card === bolt)).toBe(false);
    expect(() => game.dispatch({ type: "suspend", player: A, card: bolt })).toThrow(/can't cast/);
    expect(game.state.objects[bolt].zone).toBe("hand");
  });
});
