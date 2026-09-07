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
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
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
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const cardNamed = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
  return id;
};

const giveLands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) {
    const id = asObjectId(`land-${game.state.nextObjectSeq}`);
    game.state.nextObjectSeq += 1;
    game.state.objects[id] = {
      id,
      cardName: name,
      owner: player,
      controller: player,
      zone: "battlefield",
      tapped: false,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: 0,
      summoningSick: false, loyaltyActivatedThisTurn: false,
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
      copyOf: null,
      counters: {},
      modifiers: [],
    };
    game.state.zones.shared.battlefield.push(id);
  }
};

describe("flash", () => {
  it("lets a creature be cast on an opponent's turn with the stack in mid-air", () => {
    const game = mkGame(["Ambush Viper"], { rules: { maxHandSize: 99 } });
    game.advanceUntil(atFirstMain);
    giveLands(game, A, "Forest", 2);
    // Hand the turn to Bob so it is not Alice's.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");

    const viper = cardNamed(game, game.handOf(A), "Ambush Viper");
    // Bob (active) holds priority in his upkeep; Alice will get it after he passes.
    game.dispatch({ type: "pass-priority", player: B });
    game.dispatch({ type: "cast-spell", player: A, card: viper });
    game.advanceUntil(settled);

    expect(game.battlefield).toContain(viper);
    expect(game.state.objects[viper].zone).toBe("battlefield");
  });

  it("a non-flash creature still can't be cast at instant speed", () => {
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil((s) => s.turn.step === "upkeep");
    giveLands(game, A, "Forest", 2);
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: cardNamed(game, game.handOf(A), "Grizzly Bears"),
      }),
    ).toThrow(/main phase/);
  });
});

describe("prowess", () => {
  it("pumps +1/+1 when its controller casts a noncreature spell", () => {
    const game = mkGame(["Mountain", "Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, "Mountain", 1);
    const swiftspear = asObjectId(`sw-${game.state.nextObjectSeq}`);
    game.state.nextObjectSeq += 1;
    game.state.objects[swiftspear] = {
      id: swiftspear,
      cardName: "Monastery Swiftspear",
      owner: A,
      controller: A,
      zone: "battlefield",
      tapped: false,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: 0,
      summoningSick: false, loyaltyActivatedThisTurn: false,
      targets: null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "card",
      abilityKind: null,
      sourceObjectId: null,
      abilityIndex: null,
      timestamp: 1,
      isToken: false,
      attachedTo: null,
      isCommander: false,
      xValue: null,
      controlEndsAtCleanup: false,
      copyOf: null,
      counters: {},
      modifiers: [],
    };
    game.state.zones.shared.battlefield.push(swiftspear);

    expect(game.characteristics(swiftspear).power).toBe(1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);

    expect(game.characteristics(swiftspear).power).toBe(2);
    expect(game.characteristics(swiftspear).toughness).toBe(3);
  });

  it("does not trigger on a creature spell", () => {
    const game = mkGame(["Forest", "Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, "Forest", 2);
    const swiftspear = asObjectId(`sw2-${game.state.nextObjectSeq}`);
    game.state.nextObjectSeq += 1;
    game.state.objects[swiftspear] = {
      id: swiftspear,
      cardName: "Monastery Swiftspear",
      owner: A,
      controller: A,
      zone: "battlefield",
      tapped: false,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: 0,
      summoningSick: false, loyaltyActivatedThisTurn: false,
      targets: null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "card",
      abilityKind: null,
      sourceObjectId: null,
      abilityIndex: null,
      timestamp: 1,
      isToken: false,
      attachedTo: null,
      isCommander: false,
      xValue: null,
      controlEndsAtCleanup: false,
      copyOf: null,
      counters: {},
      modifiers: [],
    };
    game.state.zones.shared.battlefield.push(swiftspear);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Grizzly Bears"),
    });
    game.advanceUntil(settled);
    expect(game.characteristics(swiftspear).power).toBe(1);
  });
});
