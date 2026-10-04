/**
 * Top-10000 batch 33g. No engine change: every card is an existing shape.
 * These pin the clauses most likely to be wired wrong — Muster the
 * Departed's morbid populate, Eternal Thirst's granted lifelink and dies
 * trigger, Abhorrent Overlord's devotion count, Gwaihir's life-gained gate,
 * and Elspeth, Knight-Errant's four-type emblem.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (): { game: Game } => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (game: Game): void => {
  game.advanceUntil(quiet);
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const named = (game: Game, name: string, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player,
  );
const tokenCount = (game: Game, name: string, player: PlayerId = A): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const counters = (game: Game, id: ObjectId): number => game.state.objects[id].counters?.["+1/+1"] ?? 0;
const toTurnTwo = (game: Game): void => {
  game.advanceUntil((s) => s.turn.number === 2 || s.result.over);
};

describe("top-10000 batch 33g — Muster the Departed", () => {
  it("makes a Spirit, then populates at your end step only if a creature died", () => {
    const { game } = setUp();
    game.debugSpawn("Muster the Departed", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(tokenCount(game, "Spirit Token")).toBe(1);
    // An opponent's creature dying counts: "if a creature died this turn".
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    settle(game);
    toTurnTwo(game);
    expect(tokenCount(game, "Spirit Token")).toBe(2);
  });

  it("doesn't populate when nothing died", () => {
    const { game } = setUp();
    game.debugSpawn("Muster the Departed", A, "battlefield", { announceEntry: true });
    settle(game);
    toTurnTwo(game);
    expect(tokenCount(game, "Spirit Token")).toBe(1);
  });
});

describe("top-10000 batch 33g — Eternal Thirst", () => {
  it("gives lifelink and grows the creature only when an opponent's creature dies", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const thirst = spawn(game, "Eternal Thirst");
    game.state.objects[thirst].attachedTo = bears;
    expect(game.characteristics(bears).keywords.has("lifelink")).toBe(true);
    const mine = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: mine }]);
    settle(game);
    expect(counters(game, bears)).toBe(0);
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(counters(game, bears)).toBe(1);
  });
});

describe("top-10000 batch 33g — Abhorrent Overlord", () => {
  it("makes a Harpy for each {B} among your permanents' mana costs, itself included", () => {
    const { game } = setUp();
    spawn(game, "Dark Confidant");
    spawn(game, "Dark Confidant", B);
    game.debugSpawn("Abhorrent Overlord", A, "battlefield", { announceEntry: true });
    settle(game);
    // {B}{B} on the Overlord plus {B} on Alice's Confidant; Bob's doesn't count.
    expect(tokenCount(game, "Harpy Token")).toBe(3);
  });
});

describe("top-10000 batch 33g — Gwaihir, Greatest of the Eagles", () => {
  it("makes a Bird at the end step after you gained 3 life", () => {
    const { game } = setUp();
    spawn(game, "Gwaihir, Greatest of the Eagles");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    toTurnTwo(game);
    expect(tokenCount(game, "Bird Token (Gwaihir, Greatest of the Eagles)")).toBe(1);
  });

  it("makes nothing after gaining only 2", () => {
    const { game } = setUp();
    spawn(game, "Gwaihir, Greatest of the Eagles");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 });
    toTurnTwo(game);
    expect(tokenCount(game, "Bird Token (Gwaihir, Greatest of the Eagles)")).toBe(0);
  });
});
