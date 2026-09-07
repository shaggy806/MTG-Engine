import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
];

const mkGame = (aCards: readonly string[], overrides: Partial<GameConfig> = {}): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    ...overrides,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, ...overrides.rules },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;

const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
  return id;
};

const playN = (game: Game, name: string, n: number): void => {
  let played = 0;
  for (const id of [...game.handOf(A)]) {
    if (played >= n) break;
    if (game.state.objects[id].cardName === name) {
      game.dispatch({ type: "play-land", player: A, card: id });
      played += 1;
    }
  }
  if (played < n) throw new Error(`only ${played} ${name} available, needed ${n}`);
};

describe("enters-the-battlefield replacements (rule 614.1c)", () => {
  it("a tapland enters tapped and can't tap for mana that turn", () => {
    const game = mkGame(["Tranquil Thicket"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Tranquil Thicket"),
    });
    const thicket = named(game, game.battlefield, "Tranquil Thicket");

    expect(game.state.objects[thicket].tapped).toBe(true);
    const canTap = game
      .legalActions(A)
      .some((x) => x.kind === "activate-ability" && x.source === thicket);
    expect(canTap).toBe(false);
  });

  it("the tapland untaps on its controller's next turn", () => {
    const game = mkGame(["Tranquil Thicket"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Tranquil Thicket"),
    });
    const thicket = named(game, game.battlefield, "Tranquil Thicket");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");

    expect(game.state.objects[thicket].tapped).toBe(false);
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === thicket),
    ).toBe(true);
  });

  it("Walking Ballista enters with X +1/+1 counters", () => {
    const game = mkGame(["Walking Ballista"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 6);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Walking Ballista"),
      xValue: 3,
    });
    game.advanceUntil(stackEmpty);

    const ballista = named(game, game.battlefield, "Walking Ballista");
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(3);
    expect(game.characteristics(ballista)).toMatchObject({ power: 3, toughness: 3 });
  });

  it("Walking Ballista cast for X=0 is a 0/0 that dies, and loses its X", () => {
    const game = mkGame(["Walking Ballista"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Walking Ballista"),
      xValue: 0,
    });
    game.advanceUntil(stackEmpty);

    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Walking Ballista"),
    ).toBe(false);
    const dead = named(game, game.state.zones.perPlayer[A].graveyard, "Walking Ballista");
    expect(game.state.objects[dead].xValue).toBe(null);
  });

  it("its {4} ability still adds a counter after it enters", () => {
    const game = mkGame(["Walking Ballista"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 6);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Walking Ballista"),
      xValue: 1,
    });
    game.advanceUntil(stackEmpty);
    const ballista = named(game, game.battlefield, "Walking Ballista");
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(1);

    game.dispatch({ type: "activate-ability", player: A, source: ballista, abilityIndex: 0 });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(2);
    expect(game.characteristics(ballista)).toMatchObject({ power: 2, toughness: 2 });
  });
});
