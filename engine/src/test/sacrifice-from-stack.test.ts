import { describe, expect, it } from "vitest";

import { decisionCandidates } from "../bot/decisions.js";
import { AutomaticController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * Sacrificing several permanents when the only ones you control are a
 * compacted token stack (CLAUDE.md, "Token stacking").
 *
 * The offer is one entry per *object*, so nine Goblins folded into one stack
 * are one entry. Against "sacrifice three" that left no legal answer at all —
 * every candidate had one pick where the validator demanded three — and the
 * game stalled on a decision nobody could satisfy. An answer may now name a
 * stack once per token it stands for, up to its size, and the engine peels
 * one member off per occurrence.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Swamp") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

/** Real tokens, made the way a card makes them: a batch of eight or more
 * compacts into one stack object. */
function stackOf(game: Game, name: string, player: PlayerId, count: number): ObjectId {
  game.debugApplyEffect(player, { kind: "create-token", token: name, count });
  const stack = game.state.zones.shared.battlefield.find(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].isToken,
  );
  if (stack === undefined || (game.state.objects[stack].stackCount ?? 1) !== count) {
    throw new Error(`expected one stack of ${count} ${name}`);
  }
  return stack;
}

function goblins(game: Game): number {
  return game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === "Goblin Token")
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
}

/** Ask this player to sacrifice `count` creatures and stop on the decision.
 * The effect only queues the demand; the pre-priority fixpoint is what turns
 * it into an `awaiting`, so the game has to be run on a step. It stops the
 * moment the decision is up, before any controller answers it — or, when
 * there is no choice to make, the moment the queue has drained itself. */
function demand(game: Game, player: PlayerId, count: number): void {
  game.debugApplyEffect(player, {
    kind: "sacrifice",
    who: "you",
    filter: { type: "creature" },
    count,
  });
  game.advanceUntil(
    (s) =>
      s.awaiting !== null ||
      (s.pendingSacrifices.length === 0 && s.pendingSacrificeVictims.length === 0),
  );
}

function offer(game: Game, player: PlayerId): Extract<
  ReturnType<Game["legalActions"]>[number],
  { kind: "sacrifice" }
> {
  const found = game.legalActions(player).find((a) => a.kind === "sacrifice");
  if (found?.kind !== "sacrifice") throw new Error("no sacrifice offer");
  return found;
}

describe("sacrificing several tokens out of one compacted stack", () => {
  it("offers the stack's size, and takes it named that many times", () => {
    const game = table();
    const stack = stackOf(game, "Goblin Token", A, 9);
    demand(game, A, 3);

    const sacrifice = offer(game, A);
    expect(sacrifice.count).toBe(3);
    expect(sacrifice.eligible).toEqual([stack]);
    expect(sacrifice.copies?.[stack]).toBe(9);

    game.dispatch({ type: "sacrifice", player: A, permanents: [stack, stack, stack] });
    expect(game.state.awaiting).toBeNull();
    expect(goblins(game)).toBe(6);
  });

  it("refuses more of a stack than it has, and still refuses a short answer", () => {
    const game = table();
    stackOf(game, "Goblin Token", A, 8);
    demand(game, A, 8);
    // Eight tokens, eight owed: no choice at all, so nothing is asked.
    expect(game.state.awaiting).toBeNull();
    expect(goblins(game)).toBe(0);

    const game2 = table();
    const big = stackOf(game2, "Goblin Token", A, 9);
    demand(game2, A, 3);
    expect(() =>
      game2.dispatch({ type: "sacrifice", player: A, permanents: [big, big] }),
    ).toThrow(/exactly 3/);
    expect(() =>
      game2.dispatch({
        type: "sacrifice",
        player: A,
        permanents: Array<ObjectId>(10).fill(big),
      }),
    ).toThrow(/more than the 9/);
    expect(game2.state.awaiting?.kind).toBe("sacrifice");
  });

  it("still refuses one permanent twice when it is not a stack", () => {
    const game = table();
    const a = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    demand(game, A, 2);
    expect(() =>
      game.dispatch({ type: "sacrifice", player: A, permanents: [a, a] }),
    ).toThrow(/same permanent twice/);
  });

  it("mixes a stack with ordinary creatures", () => {
    const game = table();
    const stack = stackOf(game, "Goblin Token", A, 8);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    demand(game, A, 3);

    const sacrifice = offer(game, A);
    expect(sacrifice.copies?.[stack]).toBe(8);
    expect(sacrifice.copies?.[bear]).toBeUndefined();

    game.dispatch({ type: "sacrifice", player: A, permanents: [stack, bear, stack] });
    expect(goblins(game)).toBe(6);
    expect(game.state.objects[bear].zone).toBe("graveyard");
  });

  it("a controller answering for itself picks enough out of the stack", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Swamp") })),
      controllers: [A, B].map((player) => new AutomaticController(player)),
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    stackOf(game, "Goblin Token", A, 9);
    demand(game, A, 4);
    // The decision is the controller's to answer; advancing must clear it
    // rather than spin on an offer it can't satisfy.
    game.advanceUntil((s) => s.awaiting === null);
    expect(game.state.awaiting).toBeNull();
    expect(goblins(game)).toBe(5);
  });

  it("the bot enumerates answers that spend several of one stack", () => {
    const game = table();
    const stack = stackOf(game, "Goblin Token", A, 9);
    demand(game, A, 3);
    const actions = decisionCandidates(offer(game, A), A) ?? [];
    const picks = actions
      .filter((a): a is Extract<typeof a, { type: "sacrifice" }> => a.type === "sacrifice")
      .map((a) => a.permanents);
    expect(picks.length).toBeGreaterThan(0);
    for (const pick of picks) expect(pick).toEqual([stack, stack, stack]);
  });
});
