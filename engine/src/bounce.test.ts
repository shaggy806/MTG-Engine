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

const cardNamed = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
  return id;
};

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
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
    enteredBattlefieldOnTurn: game.state.turn.number,
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
  return id;
};

const playLands = (game: Game, names: readonly string[]): void => {
  for (const name of names) {
    game.dispatch({
      type: "play-land",
      player: A,
      card: cardNamed(game, game.handOf(A), name),
    });
  }
};

describe("Unsummon", () => {
  it("returns a creature to its owner's hand", () => {
    const game = mkGame(["Island", "Unsummon"]);
    game.advanceUntil(atFirstMain);
    playLands(game, ["Island"]);
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Unsummon"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[bear].zone).toBe("hand");
    expect(game.handOf(B)).toContain(bear);
    expect(
      game.eventsOfType("permanent-returned-to-hand").some((e) => e.object === bear),
    ).toBe(true);
  });

  it("makes a token cease to exist", () => {
    const game = mkGame(["Island", "Unsummon"]);
    game.advanceUntil(atFirstMain);
    playLands(game, ["Island"]);
    const token = spawn(game, "Soldier Token", B);
    game.state.objects[token].isToken = true;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Unsummon"),
      targets: [{ kind: "object", object: token }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[token]).toBeUndefined();
  });
});

describe("Man-o'-War", () => {
  it("bounces a creature via its enter-the-battlefield trigger", () => {
    const game = mkGame(["Island", "Island", "Island", "Man-o'-War"]);
    game.advanceUntil(atFirstMain);
    playLands(game, ["Island", "Island", "Island"]);
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Man-o'-War"),
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[bear].zone).toBe("hand");
    const manOWar = game.battlefield.find(
      (id) => game.state.objects[id].cardName === "Man-o'-War",
    );
    expect(manOWar).toBeDefined();
  });
});

describe("Angelic Edict", () => {
  it("exiles a target creature", () => {
    const game = mkGame(["Plains", "Plains", "Plains", "Plains", "Angelic Edict"]);
    game.advanceUntil(atFirstMain);
    playLands(game, ["Plains", "Plains", "Plains", "Plains"]);
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Angelic Edict"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[bear].zone).toBe("exile");
    expect(game.state.zones.shared.exile).toContain(bear);
    expect(game.eventsOfType("permanent-exiled").some((e) => e.object === bear)).toBe(
      true,
    );
  });
});

describe("Tome Scour", () => {
  it("mills five cards from the target player's library", () => {
    const game = mkGame(["Island", "Tome Scour"], pad([]));
    game.advanceUntil(atFirstMain);
    playLands(game, ["Island"]);
    const beforeLibrary = game.libraryOf(B).length;
    const beforeGraveyard = game.graveyardOf(B).length;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Tome Scour"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.libraryOf(B).length).toBe(beforeLibrary - 5);
    expect(game.graveyardOf(B).length).toBe(beforeGraveyard + 5);
    expect(game.eventsOfType("cards-milled")[0]?.objects).toHaveLength(5);
  });

  it("mills only what's left when the library is short", () => {
    const game = mkGame(["Island", "Tome Scour"]);
    game.advanceUntil(atFirstMain);
    playLands(game, ["Island"]);
    // Trim Bob's library to 2 cards.
    const lib = game.state.zones.perPlayer[B].library;
    lib.splice(2);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Tome Scour"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.libraryOf(B).length).toBe(0);
    expect(game.eventsOfType("cards-milled")[0]?.objects).toHaveLength(2);
  });
});

describe("Naturalize", () => {
  it("destroys a target artifact", () => {
    const game = mkGame(["Forest", "Forest", "Naturalize"]);
    game.advanceUntil(atFirstMain);
    playLands(game, ["Forest", "Forest"]);
    const bonesplitter = spawn(game, "Bonesplitter", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Naturalize"),
      targets: [{ kind: "object", object: bonesplitter }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[bonesplitter].zone).toBe("graveyard");
  });

  it("cannot be cast with no artifact or enchantment in play", () => {
    const game = mkGame(["Forest", "Forest", "Naturalize"]);
    game.advanceUntil(atFirstMain);
    playLands(game, ["Forest", "Forest"]);
    spawn(game, "Grizzly Bears", B);

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: cardNamed(game, game.handOf(A), "Naturalize"),
        targets: [],
      }),
    ).toThrow(/no legal/);
  });
});
