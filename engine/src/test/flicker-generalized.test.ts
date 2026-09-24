/**
 * The generalised `flicker`, applied directly: several targets exiled and
 * returned together, at once or by a delayed return linked to the exile.
 * Norin the Wary's own-source form is in `norin-the-wary.test.ts`.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aCards, ...Array(40).fill("Mountain")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const toEndStep = (s: GameState): boolean => s.turn.step === "end" && quiet(s);

describe("flicker of several targets — exiled together, returned together", () => {
  it("returns them all, each entering with the others already on the battlefield", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    const other = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[other].counters["+1/+1"] = 1;
    const token = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[token].isToken = true;
    // One of Bob's, returned under Alice's control.
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const refs = [bear, other, token, theirs].map((object) => ({ kind: "object" as const, object }));
    const logFrom = game.state.eventLog.length;
    game.debugApplyEffect(A, { kind: "flicker", target: [0, 1, 2, 3], underYourControl: true }, refs);

    for (const id of [bear, other, theirs]) {
      expect(game.state.objects[id].zone).toBe("battlefield");
      expect(game.state.objects[id].controller).toBe(A);
    }
    expect(game.state.objects[bear].tapped).toBe(false);
    expect(game.state.objects[other].counters["+1/+1"]).toBeUndefined();
    expect(game.state.objects[theirs].owner).toBe(B);
    // Gone for good: it stays in exile, where the next SBA check deletes it.
    expect(game.state.objects[token]?.zone).toBe("exile");

    // Every return was made before the first was announced.
    const events = game.state.eventLog.slice(logFrom).map((e) => e.type);
    const firstEntry = events.indexOf("permanent-entered-battlefield");
    expect(events.lastIndexOf("permanent-exiled")).toBeLessThan(firstEntry);
    expect(events.filter((t) => t === "permanent-entered-battlefield")).toHaveLength(3);
  });

  it("a delayed return brings back every card of the exile together", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const bears = [0, 1].map(() => game.debugSpawn("Grizzly Bears", A, "battlefield"));
    game.debugApplyEffect(
      A,
      { kind: "flicker", target: [0, 1], returnAt: "next-end-step" },
      bears.map((object) => ({ kind: "object" as const, object })),
    );
    for (const id of bears) expect(game.state.objects[id].zone).toBe("exile");
    expect(game.state.delayedTriggers).toHaveLength(1);

    game.advanceUntil(toEndStep);
    for (const id of bears) expect(game.state.objects[id].zone).toBe("battlefield");
  });
});
