import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "./characteristics.js";
import { createDefaultRegistry } from "./cards.js";
import { ScriptedController } from "./controller.js";
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

// needed-cards P15 — an enchantment *creature* Saga. No new vocab: the
// sacrifice-after-final-chapter SBA doesn't care what other types the
// permanent has, and every chapter effect is already-shipped vocab.
describe("Saga — Summon: Titan (an enchantment creature Saga)", () => {
  it("mills, then returns milled lands, then pumps a target creature — and is a 7/7 throughout", () => {
    const a = new ScriptedController(A);
    const game = mkGame(["Forest", "Forest", "Forest", "Forest", "Forest", "Summon: Titan"], {
      controllers: { [A]: a },
    });
    game.advanceUntil(atMain);
    for (const id of [...game.handOf(A)].filter((i) => game.state.objects[i].cardName === "Forest")) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const titan = [...game.handOf(A)].find((i) => game.state.objects[i].cardName === "Summon: Titan")!;
    game.dispatch({ type: "cast-spell", player: A, card: titan, targets: [] });
    game.advanceUntil(settled);

    // Chapter I: enters with 1 lore counter, mills five, and is a 7/7 creature.
    expect(game.state.objects[titan].counters.lore).toBe(1);
    expect(game.state.objects[titan].zone).toBe("battlefield");
    expect(game.characteristics(titan)).toMatchObject({ power: 7, toughness: 7 });
    const milledLands = game.state.zones.perPlayer[A].graveyard.filter(
      (id) => game.state.objects[id].cardName === "Plains",
    ).length;
    expect(milledLands).toBeGreaterThan(0);
    const landsOnField = () =>
      game.battlefield.filter(
        (id) => game.state.objects[id].controller === A && game.characteristics(id).types.includes("land"),
      ).length;
    const landsBeforeCh2 = landsOnField();

    // Alice's next turn — chapter II returns the milled lands, tapped.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "postcombat-main");
    expect(game.state.objects[titan].counters.lore).toBe(2);
    expect(landsOnField()).toBe(landsBeforeCh2 + milledLands);
    expect(
      game.battlefield
        .filter((id) => game.state.objects[id].cardName === "Plains")
        .every((id) => game.state.objects[id].tapped),
    ).toBe(true);

    // Turn 5 — chapter III pumps a target creature by the (now larger) land
    // count, then the SBA sacrifices the Saga. Force the target choice onto
    // the bear rather than the Titan itself — the engine has no generic
    // "not this object" targeting exclusion, so both are legal targets.
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    a.chooseTargetsFn = () => [{ kind: "object", object: bear }];
    const landCount = landsOnField();
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "declare-attackers");
    expect(game.eventsOfType("saga-completed").some((e) => e.object === titan)).toBe(true);
    expect(game.state.zones.perPlayer[A].graveyard).toContain(titan);
    expect(game.characteristics(bear)).toMatchObject({
      power: 2 + landCount,
      toughness: 2 + landCount,
    });
    expect(game.characteristics(bear).keywords.has("trample")).toBe(true);
  });
});
