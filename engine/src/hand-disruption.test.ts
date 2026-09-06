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
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
];

const mkGame = (
  aCards: readonly string[],
  bCards: readonly string[] = [],
  overrides: Partial<GameConfig> = {},
): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    ...overrides,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, ...overrides.rules },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const cardNamed = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
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
};

describe("Mind Rot", () => {
  it("makes the targeted opponent discard two of their choice", () => {
    const game = mkGame(["Swamp", "Swamp", "Swamp", "Mind Rot"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Swamp", 3);
    const before = game.handOf(B).length;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Mind Rot"),
      targets: [{ kind: "player", player: B }],
    });
    // Resolution hands the decision to Bob.
    game.advanceUntil((s) => s.awaiting?.kind === "discard");
    expect(game.state.awaiting).toMatchObject({ kind: "discard", player: B, count: 2, fromEffect: true });

    game.advanceUntil(settled);
    expect(game.handOf(B).length).toBe(before - 2);
    expect(game.eventsOfType("cards-discarded").some((e) => e.player === B)).toBe(true);
    // Priority came back to the active player afterwards.
    const lastPriority = [...game.events].reverse().find((e) => e.type === "priority-received");
    expect(lastPriority?.player).toBe(A);
  });

  it("discards the whole hand and asks for nothing when it is too small", () => {
    const game = mkGame(["Swamp", "Swamp", "Swamp", "Mind Rot"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Swamp", 3);
    // Trim Bob to a single card.
    const bh = game.state.zones.perPlayer[B].hand;
    const keep = bh[0];
    for (const id of bh.slice(1)) game.state.objects[id].zone = "library";
    game.state.zones.perPlayer[B].hand = [keep];
    game.state.zones.perPlayer[B].library.push(...bh.slice(1));

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Mind Rot"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.handOf(B).length).toBe(0);
    expect(game.state.awaiting).toBeNull();
  });

  it("does not end the turn — the active player continues after", () => {
    const game = mkGame(["Swamp", "Swamp", "Swamp", "Mind Rot", "Swamp"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Swamp", 3);
    const turnBefore = game.state.turn.number;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Mind Rot"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.state.turn.number).toBe(turnBefore);
    expect(game.state.turn.step).toBe("precombat-main");
    expect(game.state.priority.holder).toBe(A);
  });
});

describe("Blightning", () => {
  it("deals 3 and forces a two-card discard on the same target", () => {
    const game = mkGame(["Swamp", "Swamp", "Mountain", "Blightning"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Swamp", 2);
    playN(game, "Mountain", 1);
    const before = game.handOf(B).length;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Blightning"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(17);
    expect(game.handOf(B).length).toBe(before - 2);
  });
});
