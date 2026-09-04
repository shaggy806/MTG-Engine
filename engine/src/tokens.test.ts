import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
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
): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });

/** White-box: drop a permanent straight onto the battlefield for a test. */
const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
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
    counters: {},
    modifiers: [],
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

const playLands = (game: Game, player: PlayerId, count: number): void => {
  for (let i = 0; i < count; i += 1) {
    const land = game
      .handOf(player)
      .find((id) => game.state.objects[id].cardName === "Plains");
    if (land === undefined) throw new Error("no Plains left to play");
    game.dispatch({ type: "play-land", player, card: land });
  }
};

describe("creating tokens", () => {
  it("Raise the Alarm creates two 1/1 white Soldier tokens", () => {
    const game = mkGame(["Plains", "Plains", "Raise the Alarm"]);
    game.advanceUntil(atFirstMain);
    playLands(game, A, 2);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Raise the Alarm"),
    });
    game.advanceUntil(stackEmpty);

    const soldiers = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Soldier Token",
    );
    expect(soldiers).toHaveLength(2);
    for (const id of soldiers) {
      expect(game.state.objects[id].isToken).toBe(true);
      expect(game.state.objects[id].controller).toBe(A);
      expect(game.characteristics(id)).toMatchObject({ power: 1, toughness: 1 });
    }
  });

  it("a triggered ability can create two differently-keyworded tokens", () => {
    const game = mkGame(["Plains", "Plains", "Disenchant"]);
    const wurmcoil = spawn(game, "Wurmcoil Engine", B);
    game.advanceUntil(atFirstMain);
    playLands(game, A, 2);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Disenchant"),
      targets: [{ kind: "object", object: wurmcoil }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[wurmcoil].zone).toBe("graveyard");
    const wurms = game.battlefield.filter((id) =>
      game.state.objects[id].cardName.startsWith("Phyrexian Wurm Token"),
    );
    expect(wurms).toHaveLength(2);

    const deathtoucher = wurms.find((id) =>
      game.state.objects[id].cardName.includes("Deathtouch"),
    );
    const lifelinker = wurms.find((id) =>
      game.state.objects[id].cardName.includes("Lifelink"),
    );
    expect(deathtoucher).toBeDefined();
    expect(lifelinker).toBeDefined();
    expect(game.state.objects[deathtoucher as ObjectId].controller).toBe(B);
    expect(
      game.characteristics(deathtoucher as ObjectId).keywords.has("deathtouch"),
    ).toBe(true);
    expect(
      game.characteristics(lifelinker as ObjectId).keywords.has("lifelink"),
    ).toBe(true);
  });

  it("a token that dies ceases to exist instead of sitting in the graveyard", () => {
    const game = mkGame([
      "Plains",
      "Plains",
      "Plains",
      "Plains",
      "Raise the Alarm",
      "Disenchant",
    ]);
    game.advanceUntil(atFirstMain);
    playLands(game, A, 4);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Raise the Alarm"),
    });
    game.advanceUntil(stackEmpty);
    const [soldier1, soldier2] = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Soldier Token",
    );

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Disenchant"),
      targets: [{ kind: "object", object: soldier1 }],
    });
    game.advanceUntil(stackEmpty);

    // Destroyed: the token is gone entirely, not sitting in the graveyard
    // (the two spent instants are there, but not the token itself).
    expect(game.state.objects[soldier1]).toBeUndefined();
    expect(game.graveyardOf(A)).not.toContain(soldier1);
    expect(
      game.eventsOfType("permanent-destroyed").some((e) => e.object === soldier1),
    ).toBe(true);
    // The other token is untouched.
    expect(game.state.objects[soldier2]).toBeDefined();
    expect(game.state.objects[soldier2].zone).toBe("battlefield");
  });
});
