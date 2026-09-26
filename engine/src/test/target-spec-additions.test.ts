/**
 * Target specs by whose it is: "target opponent whose turn it is", "target
 * creature that player controls" (the player a trigger's event names), and
 * a filtered spell by its controller ("target instant or sorcery spell you
 * control"). The cards that use the first two have their own tests; these
 * pin down the specs themselves.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { TargetSpec } from "../target.js";
import { isLegalTarget, legalTargets } from "../targeting.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const makeGame = (players: readonly PlayerId[]): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: Object.fromEntries(players.map((p) => [p, new ScriptedController(p)])),
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

describe("target specs by whose", () => {
  it("'opponent whose turn it is' is the active player, and only when that's an opponent", () => {
    const game = makeGame([A, B, C]);
    const spec: TargetSpec = "opponent-whose-turn-it-is";
    const active = game.state.turnOrder[game.state.turn.activePlayerIndex];
    const others = game.state.turnOrder.filter((p) => p !== active);
    // For the active player there is none; for everyone else, exactly them.
    expect(legalTargets(game.state, registry, spec, active)).toEqual([]);
    for (const p of others) {
      expect(legalTargets(game.state, registry, spec, p)).toEqual([{ kind: "player", player: active }]);
    }
  });

  it("'a permanent that player controls' is the trigger's player's, and nothing without one", () => {
    const game = makeGame([A, B, C]);
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const giant = game.debugSpawn("Hill Giant", C, "battlefield");
    const spec: TargetSpec = { kind: "permanent", whose: "trigger-player", filter: { type: "creature" } };
    const bySource = (triggerPlayer?: PlayerId) => ({
      colors: [],
      types: [],
      ...(triggerPlayer === undefined ? {} : { triggerPlayer }),
    });
    expect(legalTargets(game.state, registry, spec, A, bySource(B))).toEqual([{ kind: "object", object: bears }]);
    expect(legalTargets(game.state, registry, spec, A, bySource(C))).toEqual([{ kind: "object", object: giant }]);
    expect(legalTargets(game.state, registry, spec, A, bySource())).toEqual([]);
  });

  it("a filtered spell spec can ask whose spell it is", () => {
    const game = makeGame([A, B]);
    const mine = game.debugSpawn("Opt", A, "stack");
    const theirs = game.debugSpawn("Opt", B, "stack");
    const ref = (object: typeof mine) => ({ kind: "object" as const, object });
    const spell = (whose?: "you" | "opponent"): TargetSpec => ({
      kind: "spell",
      ...(whose === undefined ? {} : { whose }),
      filter: { typesAnyOf: ["instant", "sorcery"] },
    });
    expect(isLegalTarget(game.state, registry, spell("you"), ref(mine), A)).toBe(true);
    expect(isLegalTarget(game.state, registry, spell("you"), ref(theirs), A)).toBe(false);
    expect(isLegalTarget(game.state, registry, spell("opponent"), ref(mine), A)).toBe(false);
    expect(isLegalTarget(game.state, registry, spell("opponent"), ref(theirs), A)).toBe(true);
    expect(isLegalTarget(game.state, registry, spell(), ref(theirs), A)).toBe(true);
  });
});
