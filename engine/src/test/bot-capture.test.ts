/**
 * A position captured from a game and saved as a training scenario
 * (`bot/capture.ts`): the options offered for picking the right answer, and
 * the file — through JSON, as it's written — replayed as a scenario.
 */

import { describe, expect, it } from "vitest";

import { captureOptions, describeMove, sameMove, scenarioFromCapture } from "../bot/capture.js";
import type { ScenarioCapture } from "../bot/capture.js";
import { EvalBotController } from "../bot/eval-bot.js";
import { DEFAULT_WEIGHTS } from "../bot/evaluate.js";
import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { Action } from "../actions.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

/** Alice's main phase: Murder in hand with three Swamps, and Bob's Craw
 * Wurm to kill. */
function position(): { game: Game; wurm: string; murder: string } {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxHandSize: 99, maxLandsPerTurn: 0 },
    decks: [
      { player: A, cards: Array(40).fill("Swamp") },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
  const murder = game.debugSpawn("Murder", A, "hand");
  const wurm = game.debugSpawn("Craw Wurm", B, "battlefield", { summoningSick: false });
  return { game, wurm, murder };
}

/** Through JSON and back, as the server writes it and a script reads it. */
const saved = (capture: ScenarioCapture): ScenarioCapture => JSON.parse(JSON.stringify(capture));

describe("capturing a position", () => {
  it("offers passing and every cast, described in words", () => {
    const { game, wurm } = position();
    const options = captureOptions(game.state, registry, A);
    expect(options[0].text).toBe("Pass");
    const kill = options.find(
      (o) =>
        o.action.type === "cast-spell" &&
        o.action.targets?.[0]?.kind === "object" &&
        o.action.targets[0].object === wurm,
    );
    expect(kill?.text).toBe("Cast Murder → Craw Wurm (bob's)");
  });

  it("replays as a training scenario with the answer picked", () => {
    const { game, wurm, murder } = position();
    const kill: Action = {
      type: "cast-spell",
      player: A,
      card: murder as never,
      targets: [{ kind: "object", object: wurm as never }],
    };
    const pass: Action = { type: "pass-priority", player: A };
    const makeBot = (player: typeof A) => new EvalBotController(player, registry, {});
    const capture = (expect: ScenarioCapture["expect"]): ScenarioCapture =>
      saved({
        version: 1,
        name: "kills the Wurm",
        note: "",
        player: A,
        state: { ...game.state, eventLog: [] },
        did: pass,
        expect,
        savedAt: "2026-09-27T00:00:00.000Z",
      });

    // v2 kills it, so "should have killed it" passes and "should have
    // passed" fails — the file judges the bot, whichever the answer.
    const right = scenarioFromCapture(capture({ kind: "action", action: kill }));
    expect(right.kind).toBe("training");
    expect(right.run(DEFAULT_WEIGHTS, registry, makeBot).passed).toBe(true);
    const wrong = scenarioFromCapture(capture({ kind: "action", action: pass }));
    expect(wrong.run(DEFAULT_WEIGHTS, registry, makeBot).passed).toBe(false);
    // "Anything but what it did" (it passed): killing it is anything else.
    const notThis = scenarioFromCapture(capture({ kind: "not-this" }));
    expect(notThis.run(DEFAULT_WEIGHTS, registry, makeBot).passed).toBe(true);
    // And the fitter's entry point sees the same position.
    const asked = right.position?.(registry);
    expect(asked !== undefined && "game" in asked && asked.player === A).toBe(true);
  });

  it("compares moves whatever order their fields were built in", () => {
    const a: Action = { type: "cast-spell", player: A, card: "x" as never, targets: [] };
    const b = JSON.parse('{"targets":[],"card":"x","player":"alice","type":"cast-spell"}') as Action;
    expect(sameMove(a, b)).toBe(true);
    expect(describeMove(position().game.state, { type: "pass-priority", player: A })).toBe("Pass");
  });
});
