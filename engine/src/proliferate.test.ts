import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const mkGame = (aCards: readonly string[], overrides: Partial<GameConfig> = {}): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    ...overrides,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, maxHandSize: 99, ...overrides.rules },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const cardNamed = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
  return id;
};

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  counters: Record<string, number> = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0,
    summoningSick: false,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    timestamp: 0,
    isToken: false,
    attachedTo: null,
    isCommander: false,
    xValue: null,
    controlEndsAtCleanup: false,
    counters: { ...counters },
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const giveLands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, A);
};

describe("proliferate", () => {
  it("adds one of each existing counter kind to every permanent that has one", () => {
    const game = mkGame(["Contentious Plan"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, "Island", 2);
    const buffed = spawn(game, "Wildwood Sentinel", A, { "+1/+1": 2 });
    const shrunk = spawn(game, "Rumbling Baloth", B, { "-1/-1": 1 }); // 4/4 → survives
    const plain = spawn(game, "Grizzly Bears", A); // no counters — untouched

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Contentious Plan"),
    });
    game.advanceUntil(settled);

    expect(game.state.objects[buffed].counters["+1/+1"]).toBe(3);
    expect(game.state.objects[shrunk].counters["-1/-1"]).toBe(2);
    expect(game.state.objects[plain].counters).toEqual({});
  });

  it("Volt Charge deals damage and then proliferates", () => {
    const game = mkGame(["Mountain", "Mountain", "Mountain", "Volt Charge"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, "Mountain", 3);
    const sentinel = spawn(game, "Wildwood Sentinel", A, { "+1/+1": 1 });
    const bear = spawn(game, "Grizzly Bears", B); // 2/2, no counters

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Volt Charge"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[bear].zone).toBe("graveyard"); // 3 damage killed it
    expect(game.state.objects[sentinel].counters["+1/+1"]).toBe(2); // proliferated
  });
});
