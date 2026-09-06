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
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
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
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

describe("Fume Spitter (sacrifice self as a cost)", () => {
  it("sacrifices itself and shrinks a target creature", () => {
    const game = mkGame(["Fume Spitter"]);
    game.advanceUntil(atFirstMain);
    const spitter = spawn(game, "Fume Spitter", A);
    const bear = spawn(game, "Grizzly Bears", B); // 2/2

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: spitter,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bear }],
    });
    // The source is already gone (sacrificed as the cost)...
    expect(game.state.objects[spitter].zone).toBe("graveyard");
    expect(
      game.eventsOfType("permanent-sacrificed").some((e) => e.object === spitter),
    ).toBe(true);
    // ...but its ability still resolves off the stack.
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[bear].counters["-1/-1"]).toBe(1);
    expect(game.characteristics(bear).power).toBe(1);
  });

  it("kills a 1-toughness creature outright", () => {
    const game = mkGame(["Fume Spitter"]);
    game.advanceUntil(atFirstMain);
    const spitter = spawn(game, "Fume Spitter", A);
    const elf = spawn(game, "Llanowar Elves", B); // 1/1

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: spitter,
      abilityIndex: 0,
      targets: [{ kind: "object", object: elf }],
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[elf].zone).toBe("graveyard");
  });
});

describe("Bloodthrone Vampire (sacrifice a creature you control)", () => {
  it("sacrifices a chosen creature and pumps itself", () => {
    const game = mkGame(["Bloodthrone Vampire"]);
    game.advanceUntil(atFirstMain);
    const vamp = spawn(game, "Bloodthrone Vampire", A); // 1/1
    const bear = spawn(game, "Grizzly Bears", A);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: vamp,
      abilityIndex: 0,
      targets: [],
      sacrifice: bear,
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.characteristics(vamp).power).toBe(3);
    expect(game.characteristics(vamp).toughness).toBe(3);
  });

  it("lists every sacrificable creature in legalActions", () => {
    const game = mkGame(["Bloodthrone Vampire"]);
    game.advanceUntil(atFirstMain);
    const vamp = spawn(game, "Bloodthrone Vampire", A);
    const bear = spawn(game, "Grizzly Bears", A);
    spawn(game, "Grizzly Bears", B); // opponent's — not a candidate

    const ability = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.source === vamp);
    expect(ability?.kind).toBe("activate-ability");
    if (ability?.kind === "activate-ability") {
      expect(new Set(ability.sacrifice?.choices)).toEqual(new Set([vamp, bear]));
    }
  });

  it("rejects an activation that names a creature the player doesn't control", () => {
    const game = mkGame(["Bloodthrone Vampire"]);
    game.advanceUntil(atFirstMain);
    const vamp = spawn(game, "Bloodthrone Vampire", A);
    const enemyBear = spawn(game, "Grizzly Bears", B);

    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: vamp,
        abilityIndex: 0,
        targets: [],
        sacrifice: enemyBear,
      }),
    ).toThrow(/sacrific/i);
  });
});
