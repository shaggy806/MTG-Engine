import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

/**
 * Rule 704.5q: "If a permanent has both a +1/+1 counter and a -1/-1 counter
 * on it, N +1/+1 and N -1/-1 counters are removed from it, where N is the
 * smaller of the number of +1/+1 and -1/-1 counters on it." A state-based
 * action, so it happens alongside the others (rule 704.3): a creature those
 * counters kill in the same check goes to the graveyard with both kinds still
 * on it, which is what makes undying and persist not return it.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return game;
}

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

function checkStateBasedActions(game: Game): void {
  const holder = game.state.priority.holder as PlayerId;
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(holder);
}

function addCounters(game: Game, id: ObjectId, counter: string, amount: number): void {
  game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter, amount }, [obj(id)]);
  checkStateBasedActions(game);
}

/** Pass priority until the stack is empty, aiming any targeted trigger at bob. */
function settle(game: Game): void {
  for (let i = 0; i < 100; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "choose-targets") {
      game.dispatch({
        type: "choose-targets",
        player: awaiting.player,
        targets: [{ kind: "player", player: B }],
      });
      continue;
    }
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind} decision`);
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) {
      return;
    }
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("the stack never emptied");
}

describe("+1/+1 and -1/-1 counters annihilate (rule 704.5q)", () => {
  it("removes one of each kind per pair, as a state-based action", () => {
    const game = table();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    addCounters(game, bears, "+1/+1", 3);
    addCounters(game, bears, "-1/-1", 1);

    expect(game.state.objects[bears].counters).toEqual({ "+1/+1": 2 });
    const removed = game.state.eventLog.filter((e) => e.type === "counter-removed");
    expect(removed.map((e) => e.type === "counter-removed" && [e.counter, e.amount])).toEqual([
      ["+1/+1", 1],
      ["-1/-1", 1],
    ]);

    addCounters(game, bears, "-1/-1", 2);
    expect(game.state.objects[bears].counters).toEqual({});
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("lets an undying creature that came back return again once a -1/-1 counter meets its +1/+1", () => {
    const game = table();
    const mindcrusher = game.debugSpawn("Geralf's Mindcrusher", A, "battlefield", {
      summoningSick: false,
    });
    // As it would be after undying returned it once.
    addCounters(game, mindcrusher, "+1/+1", 1);
    addCounters(game, mindcrusher, "-1/-1", 1);
    expect(game.state.objects[mindcrusher].counters).toEqual({});

    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(mindcrusher)]);
    checkStateBasedActions(game);
    settle(game);

    // No +1/+1 counter as it died, so undying returned it with a fresh one.
    const back = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Geralf's Mindcrusher",
    );
    expect(back).toBeDefined();
    expect(game.state.objects[back as ObjectId].counters).toEqual({ "+1/+1": 1 });
  });

  it("leaves a creature dying in the same check with both kinds, so undying doesn't return it", () => {
    const game = table();
    const mindcrusher = game.debugSpawn("Geralf's Mindcrusher", A, "battlefield", {
      summoningSick: false,
    });
    addCounters(game, mindcrusher, "+1/+1", 1);
    // A 6/6 given six -1/-1 counters: 0/0, and dead in the same check that
    // would otherwise have taken one of each off.
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "-1/-1", amount: 6 }, [
      obj(mindcrusher),
    ]);
    checkStateBasedActions(game);
    settle(game);

    expect(game.state.objects[mindcrusher].zone).toBe("graveyard");
    expect(game.state.objects[mindcrusher].lastKnown?.counters).toEqual({
      "+1/+1": 1,
      "-1/-1": 6,
    });
    expect(game.state.eventLog.some((e) => e.type === "counter-removed")).toBe(false);
    expect(
      game.state.zones.shared.battlefield.some(
        (id) => game.state.objects[id].cardName === "Geralf's Mindcrusher",
      ),
    ).toBe(false);
  });
});
