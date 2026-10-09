/**
 * The end of combat step (rule 511): it has no turn-based actions (511.1),
 * its "at end of combat" triggers trigger as it begins (511.2), and only as
 * it *ends* is everything removed from combat (511.3). So through its
 * priority window an attacker is still attacking — what an "at end of
 * combat" ability asks about it — and in the postcombat main phase nothing
 * is.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "At end of combat on your turn, you gain 1 life for each attacking
 * creature you control." Test-only, never pooled. */
const TALLY = "Test End of Combat Tally";
const TALLY_TEXT = "At end of combat on your turn, you gain 1 life for each attacking creature you control.";

const registry = createDefaultRegistry().register(
  defineCard({
    name: TALLY,
    manaCost: "{0}",
    types: ["enchantment"],
    text: TALLY_TEXT,
    triggered: [
      {
        trigger: { on: "step-begins", step: "end-combat", who: "you" },
        targets: [],
        effect: {
          kind: "gain-life",
          amount: { countOf: { type: "creature", controlledBy: "you", attacking: true } },
        },
        resolve: null,
        text: TALLY_TEXT,
      },
    ],
  }),
);

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("the end of combat step (rule 511)", () => {
  it("keeps attackers in combat through its priority window, and removes them as it ends", () => {
    const { game, a } = setUp();
    game.debugSpawn(TALLY, A);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const giant = game.debugSpawn("Hill Giant", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: giant, defender: B },
    ];
    const lifeBefore = game.state.players[A].life;
    game.advanceUntil((s) => s.turn.step === "end-combat" && quiet(s) && s.priority.holder === A);

    // The trigger counted both attackers (rule 511.2), and they're still
    // attacking in the step's priority window.
    expect(game.state.players[A].life).toBe(lifeBefore + 2);
    expect(game.state.objects[bears].attacking).toBe(B);
    expect(game.state.objects[giant].attacking).toBe(B);

    // As the step ends, everything leaves combat (rule 511.3).
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.objects[bears].attacking).toBeNull();
    expect(game.state.objects[giant].attacking).toBeNull();
  });
});
