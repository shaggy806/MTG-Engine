import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { parseManaCost } from "./mana.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
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
    copyOf: null,
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

/** Play exactly `n` lands named `name` from Alice's hand. */
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

describe("parseManaCost with {X}", () => {
  it("counts {X} separately from generic", () => {
    expect(parseManaCost("{X}{R}")).toEqual({
      generic: 0,
      colored: { W: 0, U: 0, B: 0, R: 1, G: 0 },
      colorless: 0,
      x: 1,
      hybrid: [],
    });
    expect(parseManaCost("{X}{X}{2}").x).toBe(2);
  });
});

describe("Fireball", () => {
  it("deals X damage for the chosen X", () => {
    const game = mkGame(["Mountain", "Mountain", "Mountain", "Mountain", "Fireball"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 4);
    const baloth = spawn(game, "Rumbling Baloth", B); // 4/4

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Fireball"),
      targets: [{ kind: "object", object: baloth }],
      xValue: 3,
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[baloth].damageMarked).toBe(3);
    expect(game.state.objects[baloth].zone).toBe("battlefield");
    expect(game.eventsOfType("spell-cast")[0]?.x).toBe(3);
  });

  it("kills a creature when X is lethal", () => {
    const game = mkGame(["Mountain", "Mountain", "Mountain", "Mountain", "Fireball"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 4);
    const bear = spawn(game, "Grizzly Bears", B); // 2/2

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Fireball"),
      targets: [{ kind: "object", object: bear }],
      xValue: 2,
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[bear].zone).toBe("graveyard");
  });

  it("with X=0 spends only the colored pip and does nothing", () => {
    const game = mkGame(["Mountain", "Fireball"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 4);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Fireball"),
      targets: [{ kind: "player", player: B }],
      xValue: 0,
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.players[B].life).toBe(20);
    expect(game.eventsOfType("spell-cast")[0]?.x).toBe(0);
  });

  it("rejects an X larger than the player can pay for", () => {
    const game = mkGame(["Mountain", "Mountain", "Fireball"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 2); // 2 mana: {R} + 1 generic ⇒ max X is 1

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: cardNamed(game, game.handOf(A), "Fireball"),
        targets: [{ kind: "player", player: B }],
        xValue: 5,
      }),
    ).toThrow(/cannot pay/);
  });

  it("reports maxX in legalActions", () => {
    const game = mkGame(["Mountain", "Mountain", "Mountain", "Fireball"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 3); // 3 mana ⇒ {R} + up to X=2

    const fireball = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Fireball");
    expect(fireball?.kind).toBe("cast-spell");
    if (fireball?.kind === "cast-spell") {
      expect(fireball.xCost?.maxX).toBe(2);
    }
  });

  it("survives a snapshot/restore with X chosen on the stack", () => {
    const game = mkGame(["Mountain", "Mountain", "Mountain", "Mountain", "Fireball"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 4);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Fireball"),
      targets: [{ kind: "player", player: B }],
      xValue: 3,
    });
    const restored = Game.fromSnapshot(game.snapshot());
    restored.advanceUntil(stackEmpty);
    game.advanceUntil(stackEmpty);
    expect(restored.state.players[B].life).toBe(game.state.players[B].life);
    expect(game.state.players[B].life).toBe(17);
  });
});
