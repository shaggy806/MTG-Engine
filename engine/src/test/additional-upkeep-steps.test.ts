/**
 * Additional upkeep steps after a phase (Obeka, Splitter of Seconds — rules
 * 500.8, 500.10, 500.11): an upkeep step belongs to a beginning phase, so
 * each is a beginning phase of its own straight after the combat phase under
 * way, with its untap and draw steps skipped; "at the beginning of your
 * upkeep" triggers in each, and then the turn goes on to the postcombat main
 * phase. A phase added after the same phase later goes first (500.8). "You
 * get" adds nothing on another player's turn (500.10a).
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { Step } from "../turn.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "At the beginning of your upkeep, you gain 1 life." */
const UPKEEP_GAIN = "Test Upkeep Gain";

const registry = createDefaultRegistry().register(
  defineCard({
    name: UPKEEP_GAIN,
    manaCost: "{0}",
    types: ["enchantment"],
    text: "At the beginning of your upkeep, you gain 1 life.",
    triggered: [
      {
        trigger: { on: "step-begins", step: "upkeep", who: "you" },
        targets: [],
        effect: { kind: "gain-life", amount: 1 },
        resolve: null,
        text: "At the beginning of your upkeep, you gain 1 life.",
      },
    ],
  }),
);

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
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;

/** The steps begun this turn after `from` events in, in order. */
const stepsSince = (game: Game, from: number): Step[] =>
  game.state.eventLog
    .slice(from)
    .flatMap((e) => (e.type === "step-began" ? [e.step] : []));

describe("additional upkeep steps (Obeka, Splitter of Seconds)", () => {
  it("each is a beginning phase with only an upkeep step, after this combat; upkeep triggers fire in each", () => {
    const { game, a } = setUp();
    game.debugSpawn(UPKEEP_GAIN, A, "battlefield");
    const obeka = game.debugSpawn("Obeka, Splitter of Seconds", A, "battlefield", { summoningSick: false });
    const life = game.state.players[A].life;
    const hand = game.handOf(A).length;
    const from = game.state.eventLog.length;
    a.declareAttackersFn = () => [{ attacker: obeka, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    // Two combat damage: two additional upkeep steps, and nothing else of a
    // beginning phase — no untap, no draw.
    expect(stepsSince(game, from)).toEqual([
      "begin-combat",
      "declare-attackers",
      "declare-blockers",
      "combat-damage",
      "end-combat",
      "upkeep",
      "upkeep",
      "postcombat-main",
    ]);
    expect(game.state.players[A].life).toBe(life + 2);
    expect(game.handOf(A).length).toBe(hand);
    expect(game.state.turn.number).toBe(1);
  });

  it("a phase added after the same combat later goes first (rule 500.8)", () => {
    const { game } = setUp();
    game.advanceUntil((s) => s.turn.step === "combat-damage");
    game.debugApplyEffect(A, { kind: "additional-upkeep-steps", amount: 1 });
    game.advanceUntil((s) => s.turn.step === "end-combat");
    game.debugApplyEffect(A, { kind: "additional-combat", afterThisPhase: true });
    const from = game.state.eventLog.length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(stepsSince(game, from)).toEqual([
      "begin-combat",
      "declare-attackers",
      "declare-blockers",
      "combat-damage",
      "end-combat",
      "upkeep",
      "postcombat-main",
    ]);
  });

  it("adds nothing on another player's turn (rule 500.10a)", () => {
    const { game } = setUp();
    game.advanceUntil((s) => s.turn.step === "combat-damage");
    game.debugApplyEffect(B, { kind: "additional-upkeep-steps", amount: 2 });
    const from = game.state.eventLog.length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(stepsSince(game, from)).not.toContain("upkeep");
  });

  it("suspend's 'at the beginning of your upkeep' removes a time counter in an additional upkeep (rule 702.62a)", () => {
    const { game, a } = setUp();
    game.debugSpawn("Mountain", A, "battlefield");
    const riftBolt = game.debugSpawn("Rift Bolt", A, "hand");
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    game.dispatch({ type: "suspend", player: A, card: riftBolt });
    game.advanceUntil(quiet);
    expect(game.state.objects[riftBolt].counters.time).toBe(1);
    const obeka = game.debugSpawn("Obeka, Splitter of Seconds", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: obeka, defender: B }];
    const life = game.state.players[B].life;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    // Obeka's two damage, then Rift Bolt's last counter comes off in the
    // first additional upkeep and it's cast: three more.
    expect(game.state.turn.number).toBe(1);
    expect(game.state.players[B].life).toBe(life - 2 - 3);
  });

  it("a delayed 'at the beginning of the next upkeep' made this turn waits for the additional one", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, {
      kind: "delayed-trigger",
      at: "next-upkeep",
      effect: { kind: "gain-life", amount: 3 },
      text: "At the beginning of the next upkeep, you gain 3 life.",
    });
    const life = game.state.players[A].life;
    game.advanceUntil((s) => s.turn.step === "combat-damage");
    game.debugApplyEffect(A, { kind: "additional-upkeep-steps", amount: 1 });
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.players[A].life).toBe(life + 3);
  });
});
