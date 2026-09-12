/**
 * Panharmonicon-style ETB-trigger doubling (needed-cards P15 — Starfield
 * Vocalist): "If a permanent entering the battlefield causes a triggered
 * ability of a permanent you control to trigger, that ability triggers an
 * additional time." New: `StaticAbility.doubleEntryTriggers` +
 * `Game.entryTriggerDoublers`, folded into the same `multiplier` the
 * `stackCount` / batch-`count` machinery already uses.
 */
import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const mkGame = (aHand: readonly string[]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad([]) },
    ],
  });

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const drawsBy = (game: Game, player: PlayerId): number =>
  game.eventsOfType("card-drawn").filter((e) => e.player === player).length;

describe("Starfield Vocalist — doubles an ETB trigger", () => {
  it("draws twice off Kiora's power-4+ trigger instead of once", () => {
    const game = mkGame(["Craw Wurm"]); // 6/4, {4}{G}{G}
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Kiora, Behemoth Beckoner", A, "battlefield");
    game.debugSpawn("Starfield Vocalist", A, "battlefield");
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const before = drawsBy(game, A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Craw Wurm"),
    });
    game.advanceUntil(settled);

    expect(drawsBy(game, A)).toBe(before + 2);
  });

  it("stacks — two Vocalists trigger it three times total", () => {
    const game = mkGame(["Craw Wurm"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Kiora, Behemoth Beckoner", A, "battlefield");
    game.debugSpawn("Starfield Vocalist", A, "battlefield");
    game.debugSpawn("Starfield Vocalist", A, "battlefield");
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const before = drawsBy(game, A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Craw Wurm"),
    });
    game.advanceUntil(settled);

    expect(drawsBy(game, A)).toBe(before + 3);
  });

  it("only doubles its own controller's triggered ability", () => {
    const game = mkGame(["Craw Wurm"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Kiora, Behemoth Beckoner", A, "battlefield");
    game.debugSpawn("Starfield Vocalist", B, "battlefield"); // an opponent's
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const before = drawsBy(game, A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Craw Wurm"),
    });
    game.advanceUntil(settled);

    expect(drawsBy(game, A)).toBe(before + 1);
  });
});
