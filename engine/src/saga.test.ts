import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "./characteristics.js";
import { createDefaultRegistry } from "./cards.js";
import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const reg = createDefaultRegistry();

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Plains"),
];

const mkGame = (aCards: readonly string[], overrides: Partial<GameConfig> = {}): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, ...overrides.rules },
    ...overrides,
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });

const atMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const knights = (game: Game): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Knight Token",
  );

describe("Saga — History of Benalia", () => {
  it("chapters fire on lore counts 1/2 then 3, and the Saga is sacrificed after the last", () => {
    const game = mkGame(["History of Benalia"]);
    game.advanceUntil(atMain);
    for (const id of [...game.handOf(A)].filter((i) => game.state.objects[i].cardName === "Plains").slice(0, 3)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const saga = [...game.handOf(A)].find((i) => game.state.objects[i].cardName === "History of Benalia")!;
    game.dispatch({ type: "cast-spell", player: A, card: saga, targets: [] });
    game.advanceUntil(settled);

    // Chapter I: enters with 1 lore counter, one Knight token.
    expect(game.state.objects[saga].counters.lore).toBe(1);
    expect(knights(game)).toHaveLength(1);

    // Alice's next turn — chapter I fires again at lore 2.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "postcombat-main");
    expect(game.state.objects[saga].counters.lore).toBe(2);
    expect(knights(game)).toHaveLength(2);
    expect(game.state.objects[saga].zone).toBe("battlefield");

    // Turn 5 — lore 3, chapter III pumps Knights, then the SBA sacrifices it.
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "postcombat-main");
    expect(game.eventsOfType("saga-completed").some((e) => e.object === saga)).toBe(true);
    expect(game.state.zones.perPlayer[A].graveyard).toContain(saga);
    for (const k of knights(game)) {
      const c = computeCharacteristics(game.state, reg, k);
      expect([c.power, c.toughness]).toEqual([4, 3]); // 2/2 + 2/1 this turn
    }
  });

  it("a Saga cast this turn does not get a second lore counter from the same main phase", () => {
    const game = mkGame(["History of Benalia"]);
    game.advanceUntil(atMain);
    for (const id of [...game.handOf(A)].filter((i) => game.state.objects[i].cardName === "Plains").slice(0, 3)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const saga = [...game.handOf(A)].find((i) => game.state.objects[i].cardName === "History of Benalia")!;
    game.dispatch({ type: "cast-spell", player: A, card: saga, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[saga].counters.lore).toBe(1);
  });
});
