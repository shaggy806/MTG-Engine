import { describe, expect, it } from "vitest";

import { isManaAbility } from "./abilities.js";
import { createDefaultRegistry } from "./cards.js";
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
  aCards: readonly string[] = [],
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

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { tapped?: boolean; sick?: boolean } = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: opts.tapped ?? false,
    damageMarked: 0,
    enteredBattlefieldOnTurn: opts.sick ? game.state.turn.number : 0,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    sourceObjectId: null,
    abilityIndex: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

describe("isManaAbility", () => {
  const registry = createDefaultRegistry();

  it("recognizes {T}: Add abilities", () => {
    expect(isManaAbility(registry.get("Forest").activated[0])).toBe(true);
    expect(isManaAbility(registry.get("Llanowar Elves").activated[0])).toBe(true);
  });

  it("rejects a targeted damage ability", () => {
    expect(isManaAbility(registry.get("Prodigal Sorcerer").activated[0])).toBe(
      false,
    );
  });
});

describe("mana abilities", () => {
  it("a mana dork helps pay for a spell", () => {
    const game = mkGame(["Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    const elves = spawn(game, "Llanowar Elves", A);
    const forest = game.handOf(A)[0];
    game.dispatch({ type: "play-land", player: A, card: forest });
    const bears = named(game, game.handOf(A), "Grizzly Bears");

    game.dispatch({ type: "cast-spell", player: A, card: bears });
    expect(game.stack).toHaveLength(1);
    expect(game.state.objects[elves].tapped).toBe(true);
    expect(game.state.objects[forest].tapped).toBe(true);

    game.advanceUntil(stackEmpty);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("a summoning-sick dork can't be tapped for mana", () => {
    const game = mkGame(["Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    spawn(game, "Llanowar Elves", A, { sick: true });
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    const bears = named(game, game.handOf(A), "Grizzly Bears");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: bears }),
    ).toThrow(/cannot pay/);
  });

  it("a tapped dork untaps on its controller's next turn", () => {
    const game = mkGame(["Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    const elves = spawn(game, "Llanowar Elves", A);
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Grizzly Bears"),
    });
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(game.state.objects[elves].tapped).toBe(false);
  });

  it("manually activating a mana ability fills the pool without using the stack", () => {
    const game = mkGame(["Forest"]);
    game.advanceUntil(atFirstMain);
    const forest = game.handOf(A)[0];
    game.dispatch({ type: "play-land", player: A, card: forest });
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: forest,
      abilityIndex: 0,
    });
    expect(game.state.players[A].manaPool.G).toBe(1);
    expect(game.state.objects[forest].tapped).toBe(true);
    expect(game.stack).toHaveLength(0);
    expect(
      game.eventsOfType("ability-activated").some((e) => !e.onStack),
    ).toBe(true);
  });
});

describe("activated abilities on the stack", () => {
  const activateTim = (
    game: Game,
    tim: ObjectId,
    player: PlayerId,
    target: ObjectId | PlayerId,
    isPlayer: boolean,
  ): void => {
    game.dispatch({
      type: "activate-ability",
      player,
      source: tim,
      abilityIndex: 0,
      targets: [
        isPlayer
          ? { kind: "player", player: target as PlayerId }
          : { kind: "object", object: target as ObjectId },
      ],
    });
  };

  it("Prodigal Sorcerer's ability goes on the stack, taps it, and resolves", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const tim = spawn(game, "Prodigal Sorcerer", A);

    activateTim(game, tim, A, B, true);
    expect(game.stack).toHaveLength(1);
    expect(game.state.objects[tim].tapped).toBe(true);
    expect(game.eventsOfType("ability-activated")).toHaveLength(1);

    game.advanceUntil(stackEmpty);
    expect(game.state.players[B].life).toBe(19);
    expect(game.eventsOfType("ability-resolved")).toHaveLength(1);
  });

  it("can't activate a {T} ability when already tapped", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const tim = spawn(game, "Prodigal Sorcerer", A, { tapped: true });
    expect(() => activateTim(game, tim, A, B, true)).toThrow(/already tapped/);
  });

  it("can't activate a {T} ability with summoning sickness", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const tim = spawn(game, "Prodigal Sorcerer", A, { sick: true });
    expect(() => activateTim(game, tim, A, B, true)).toThrow(/summoning sickness/);
  });

  it("can't activate an opponent's ability", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const tim = spawn(game, "Prodigal Sorcerer", B);
    expect(() => activateTim(game, tim, A, B, true)).toThrow(/does not control/);
  });

  it("can't activate the ability of a permanent that isn't on the battlefield", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: asObjectId("ghost"),
        abilityIndex: 0,
      }),
    ).toThrow(/not on the battlefield/);
  });

  it("an ability fizzles if its target is gone by resolution", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const tim1 = spawn(game, "Prodigal Sorcerer", A);
    const tim2 = spawn(game, "Prodigal Sorcerer", A);
    const goblin = spawn(game, "Raging Goblin", B); // 1/1

    activateTim(game, tim1, A, goblin, false);
    activateTim(game, tim2, A, goblin, false);
    expect(game.stack).toHaveLength(2);

    game.advanceUntil(stackEmpty);
    expect(game.state.objects[goblin].zone).toBe("graveyard");
    expect(game.eventsOfType("spell-fizzled")).toHaveLength(1);
  });

  it("an ability still resolves after its source has left the battlefield", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const aTim = spawn(game, "Prodigal Sorcerer", A);
    const bTim = spawn(game, "Prodigal Sorcerer", B);

    activateTim(game, aTim, A, bTim, false); // A's ability targets B's Tim
    game.dispatch({ type: "pass-priority", player: A });
    activateTim(game, bTim, B, aTim, false); // B responds, targeting A's Tim
    expect(game.stack).toHaveLength(2);

    game.advanceUntil(stackEmpty);
    // B's ability resolves first and kills A's Tim; A's ability still resolves.
    expect(game.state.objects[aTim].zone).toBe("graveyard");
    expect(game.state.objects[bTim].zone).toBe("graveyard");
  });

  it("snapshots and restores with an ability on the stack", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const tim = spawn(game, "Prodigal Sorcerer", A);
    activateTim(game, tim, A, B, true);

    const snap = game.snapshot();
    const restored = Game.fromSnapshot(snap);
    expect(restored.state).toEqual(snap);

    restored.advanceUntil(stackEmpty);
    game.advanceUntil(stackEmpty);
    expect(restored.state.players[B].life).toBe(game.state.players[B].life);
  });
});

describe("regression", () => {
  it("advance() with default controllers still finishes a game", () => {
    const game = mkGame(["Llanowar Elves"]);
    game.advance();
    expect(game.isOver).toBe(true);
  });
});
