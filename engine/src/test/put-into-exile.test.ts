/**
 * Cards put into exile at once (`cards-put-into-exile`, one per simultaneous
 * move) and the batched `put-into-exile` trigger on it — Ketramose, the New
 * Dawn's "whenever one or more cards are put into exile from graveyards
 * and/or the battlefield during your turn". Tokens aren't cards.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const KETRAMOSE = "Test New Dawn";
/** "Whenever one or more cards are put into exile from libraries, gain that
 * much life" — Laelia, the Blade Reforged's trigger, counted. */
const LIBRARY_WATCH = "Test Library Watch";
const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: KETRAMOSE,
      manaCost: "{0}",
      types: ["enchantment"],
      text: KETRAMOSE,
      triggered: [
        {
          trigger: { on: "put-into-exile", who: "any", from: ["graveyard", "battlefield"] },
          condition: { kind: "your-turn" },
          targets: [],
          effect: { kind: "gain-life", amount: { triggerValue: true } },
          resolve: null,
          text: KETRAMOSE,
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: LIBRARY_WATCH,
      manaCost: "{0}",
      types: ["enchantment"],
      text: LIBRARY_WATCH,
      triggered: [
        {
          trigger: { on: "put-into-exile", who: "any", from: ["library"] },
          targets: [],
          effect: { kind: "gain-life", amount: { triggerValue: true } },
          resolve: null,
          text: LIBRARY_WATCH,
        },
      ],
    }),
  );

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
  s.suspendedResolutions.length === 0;
const run = (game: Game, effect: EffectSpec, targets: readonly (PlayerId | ObjectId)[] = []): void => {
  game.debugApplyEffect(
    A,
    effect,
    targets.map((t) =>
      game.state.players[t as PlayerId] !== undefined
        ? { kind: "player", player: t as PlayerId }
        : { kind: "object", object: t as ObjectId },
    ),
  );
  game.advanceUntil(quiet);
};
const fired = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;

describe("one or more cards put into exile", () => {
  it("a whole graveyard exiled is one trigger, valued how many", () => {
    const game = setUp();
    const watcher = game.debugSpawn(KETRAMOSE, A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Grizzly Bears", B, "graveyard");
    run(game, { kind: "exile-graveyard", target: 0 }, [B]);
    expect(fired(game, watcher)).toBe(1);
    expect(game.state.players[A].life).toBe(23);
  });

  it("from the battlefield counts; tokens, and cards from a library, don't", () => {
    const game = setUp();
    const watcher = game.debugSpawn(KETRAMOSE, A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    run(game, { kind: "exile", target: 0 }, [bears]);
    expect(fired(game, watcher)).toBe(1);
    run(game, { kind: "create-token", token: "Goblin Token", count: 1 });
    const goblin = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    )!;
    run(game, { kind: "exile", target: 0 }, [goblin]);
    run(game, { kind: "impulse-exile", amount: 2, duration: "end-of-turn" });
    expect(fired(game, watcher)).toBe(1);
  });

  it("only during your turn", () => {
    const game = setUp();
    const watcher = game.debugSpawn(KETRAMOSE, A, "battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    run(game, { kind: "exile", target: 0 }, [bears]);
    expect(fired(game, watcher)).toBe(0);
  });
});

describe("exiled from the top of a library", () => {
  const movesSince = (game: Game, since: number) =>
    game.eventsOfType("cards-put-into-exile").filter((e) => e.seq >= since);

  it("the top three cards are one move, each arrival naming its owner (Ulamog's attack)", () => {
    const game = setUp();
    const watcher = game.debugSpawn(LIBRARY_WATCH, A, "battlefield");
    const top = game.state.zones.perPlayer[B].library.slice(0, 3);
    const since = game.state.eventSeq;
    run(game, { kind: "exile-from-library", whose: 0, amount: 3 }, [B]);
    const moves = movesSince(game, since);
    expect(moves).toHaveLength(1);
    expect(moves[0].arrivals).toEqual(top.map((object) => ({ object, from: "library", owner: B })));
    expect(fired(game, watcher)).toBe(1);
    expect(game.state.players[A].life).toBe(23);
  });

  it("the top card of each player's library is one move too (Pako)", () => {
    const game = setUp();
    const watcher = game.debugSpawn(LIBRARY_WATCH, A, "battlefield");
    const since = game.state.eventSeq;
    run(game, { kind: "exile-from-library", whose: "each-player", amount: 1 });
    const moves = movesSince(game, since);
    expect(moves).toHaveLength(1);
    expect(moves[0].arrivals.map((a) => a.owner).sort()).toEqual([A, B].sort());
    expect(fired(game, watcher)).toBe(1);
  });

  it("a face-down exile from an opponent's library still names whose cards they are", () => {
    const game = setUp();
    const since = game.state.eventSeq;
    run(
      game,
      { kind: "impulse-exile", amount: 2, whose: 0, duration: "while-exiled", faceDown: true },
      [B],
    );
    const moves = movesSince(game, since);
    expect(moves).toHaveLength(1);
    expect(moves[0].arrivals).toHaveLength(2);
    expect(moves[0].arrivals.every((a) => a.from === "library" && a.owner === B)).toBe(true);
  });
});
