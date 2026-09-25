/**
 * Poison in the bots' view of the game: the evaluation reads it as a loss
 * clock beside commander damage, and the searched proliferate answers include
 * the one that puts a counter on a poisoned opponent.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { decisionCandidates } from "../bot/decisions.js";
import { playerFeatures } from "../bot/features.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

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

describe("poison and the bots", () => {
  it("the loss-clock feature reads poison on commander damage's scale", () => {
    const game = setUp();
    expect(playerFeatures(game.state, registry, B, false, 7).commanderDamage).toBe(0);
    game.state.players[B].counters.poison = 5;
    expect(playerFeatures(game.state, registry, B, false, 7).commanderDamage).toBeCloseTo(10.5);
  });

  it("proliferate's candidates include a counter on a poisoned opponent", () => {
    const game = setUp();
    const mine: ObjectId = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[mine].counters["+1/+1"] = 1;
    // Theirs has a counter too: "everything" would grow it.
    const theirs: ObjectId = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].counters["+1/+1"] = 1;
    game.state.players[B].counters.poison = 3;
    const offer: LegalAction = {
      kind: "proliferate",
      eligible: [
        { kind: "object", object: mine },
        { kind: "object", object: theirs },
        { kind: "player", player: B },
      ],
    } as LegalAction;
    const poisonOf = (p: PlayerId) => game.state.players[p]?.counters.poison ?? 0;
    const candidates = decisionCandidates(
      offer,
      A,
      (ids) => ids,
      (id) => game.state.objects[id]?.controller,
      poisonOf,
    );
    const chosen = (candidates ?? []).map((c) => (c.type === "proliferate" ? c.chosen : []));
    expect(chosen).toContainEqual([
      { kind: "object", object: mine },
      { kind: "player", player: B },
    ]);
  });
});
