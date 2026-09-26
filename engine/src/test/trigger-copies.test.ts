import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * A triggered ability that chooses no targets, fired once per token of a
 * token stack — Authority of the Consuls ("whenever a creature an opponent
 * controls enters, you gain 1 life") seeing twenty Goblins enter at once. By
 * the rules that's twenty triggers, each its own resolution: "gain 1 life"
 * can't become one "gain 20 life", or Ajani's Pridemate would see one gain
 * instead of twenty. They go on the stack as one object standing for all of
 * them (`GameObject.stackCount`) and still resolve one at a time; the engine
 * used to mint an object per trigger, which is what timed the fuzzer out
 * against a stack of Scute Swarms.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.turnOrder[s.turn.activePlayerIndex] === A && s.priority.holder === A,
  );
  return game;
}

function place(game: Game): void {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
}

const authorityOnStack = (game: Game): ObjectId[] =>
  game.state.zones.shared.stack.filter(
    (id) => game.state.objects[id].cardName === "Authority of the Consuls",
  );

function twentyGoblinsForBob(game: Game): void {
  game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 20 }, []);
  place(game);
}

describe("identical target-free triggers from a token stack", () => {
  it("go on the stack as one object standing for all twenty", () => {
    const game = table();
    game.debugSpawn("Authority of the Consuls", A, "battlefield");
    twentyGoblinsForBob(game);

    const [trigger] = authorityOnStack(game);
    expect(authorityOnStack(game)).toHaveLength(1);
    expect(game.state.objects[trigger].stackCount).toBe(20);
    expect(game.viewFor(A).objects[trigger]?.stackCount).toBe(20);
  });

  it("resolve one at a time, each its own life gain", () => {
    const game = table();
    game.debugSpawn("Authority of the Consuls", A, "battlefield");
    const pridemate = game.debugSpawn("Ajani's Pridemate", A, "battlefield", { summoningSick: false });
    const life = game.state.players[A].life;
    twentyGoblinsForBob(game);
    const [trigger] = authorityOnStack(game);

    // Everyone passes: one copy resolves, and the rest are still there.
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    expect(game.state.players[A].life).toBe(life + 1);
    expect(game.state.objects[trigger].stackCount).toBe(19);
    expect(game.state.zones.shared.stack).toContain(trigger);

    for (let i = 0; i < 200 && game.state.zones.shared.stack.length > 0; i += 1) {
      game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
    }
    expect(game.state.zones.shared.stack).toEqual([]);
    expect(game.state.players[A].life).toBe(life + 20);
    // Twenty gains, so Ajani's Pridemate saw twenty.
    expect(
      game.state.eventLog.filter((e) => e.type === "life-changed" && e.player === A && e.delta > 0),
    ).toHaveLength(20);
    expect(game.state.objects[pridemate].counters["+1/+1"]).toBe(20);
  });

  it("lose one copy when one is countered", () => {
    const game = table();
    game.debugSpawn("Authority of the Consuls", A, "battlefield");
    twentyGoblinsForBob(game);
    const [trigger] = authorityOnStack(game);

    game.debugApplyEffect(B, { kind: "counter", target: 0 }, [{ kind: "object", object: trigger }]);
    expect(game.state.objects[trigger].stackCount).toBe(19);
  });
});
