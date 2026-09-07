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
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
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

describe("fight", () => {
  it("Prey Upon — a smaller creature dies, the bigger one survives with damage", () => {
    const game = mkGame(["Forest", "Prey Upon"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Forest", 1);
    const mine = spawn(game, "Grizzly Bears", A); // 2/2
    const theirs = spawn(game, "Rumbling Baloth", B); // 4/4

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Prey Upon"),
      targets: [
        { kind: "object", object: mine },
        { kind: "object", object: theirs },
      ],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[mine].zone).toBe("graveyard");
    expect(game.state.objects[theirs].zone).toBe("battlefield");
    expect(game.state.objects[theirs].damageMarked).toBe(2);
  });

  it("Rabid Bite — one-sided: their creature dies, mine takes nothing", () => {
    const game = mkGame(["Forest", "Forest", "Rabid Bite"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Forest", 2);
    const mine = spawn(game, "Rumbling Baloth", A); // 4/4
    const theirs = spawn(game, "Grizzly Bears", B); // 2/2

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Rabid Bite"),
      targets: [
        { kind: "object", object: mine },
        { kind: "object", object: theirs },
      ],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[theirs].zone).toBe("graveyard");
    expect(game.state.objects[mine].damageMarked).toBe(0);
  });
});

describe("indestructible", () => {
  it("survives lethal damage", () => {
    const game = mkGame(["Mountain", "Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 1);
    const myr = spawn(game, "Darksteel Myr", B); // 0/3 indestructible

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: myr }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[myr].zone).toBe("battlefield");
    expect(game.state.objects[myr].damageMarked).toBe(3);
  });

  it("survives a destroy effect (and logs why)", () => {
    const game = mkGame(["Plains", "Plains", "Disenchant"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Plains", 2);
    const myr = spawn(game, "Darksteel Myr", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Disenchant"),
      targets: [{ kind: "object", object: myr }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[myr].zone).toBe("battlefield");
    expect(
      game.eventsOfType("permanent-destroy-prevented").some((e) => e.object === myr),
    ).toBe(true);
  });

  it("still dies to 0 toughness", () => {
    const game = mkGame(["Swamp", "Fume Spitter", "Fume Spitter", "Fume Spitter"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Swamp", 1);
    const myr = spawn(game, "Darksteel Myr", B); // 0/3
    for (let i = 0; i < 3; i += 1) {
      const spitter = spawn(game, "Fume Spitter", A);
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: spitter,
        abilityIndex: 0,
        targets: [{ kind: "object", object: myr }],
      });
      game.advanceUntil(settled);
    }
    expect(game.state.objects[myr].zone).toBe("graveyard");
  });
});

describe("hexproof", () => {
  it("blocks an opponent's targeted spell", () => {
    const game = mkGame(["Mountain", "Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 1);
    const scout = spawn(game, "Gladecover Scout", B);

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: cardNamed(game, game.handOf(A), "Lightning Bolt"),
        targets: [{ kind: "object", object: scout }],
      }),
    ).toThrow(/illegal target|no legal/);
  });

  it("does not block the controller's own spell", () => {
    const game = mkGame(["Forest", "Giant Growth"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Forest", 1);
    const scout = spawn(game, "Gladecover Scout", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Giant Growth"),
      targets: [{ kind: "object", object: scout }],
    });
    game.advanceUntil(settled);
    expect(game.characteristics(scout).power).toBe(4);
  });
});
