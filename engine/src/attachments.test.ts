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

describe("Auras", () => {
  it("attaches to its target on resolution and grants its bonus", () => {
    const game = mkGame(["Plains", "Holy Strength"]);
    const bear = spawn(game, "Grizzly Bears", A); // 2/2
    game.advanceUntil(atFirstMain);
    playLands(game, A, 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Holy Strength"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);

    const aura = named(game, game.battlefield, "Holy Strength");
    expect(game.state.objects[aura].attachedTo).toBe(bear);
    expect(game.characteristics(bear)).toMatchObject({ power: 3, toughness: 4 });
  });

  it("falls off to the graveyard once its host is gone", () => {
    const game = mkGame([
      "Plains",
      "Plains",
      "Plains",
      "Holy Strength",
      "Disenchant",
    ]);
    const bear = spawn(game, "Grizzly Bears", A);
    game.advanceUntil(atFirstMain);
    playLands(game, A, 3);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Holy Strength"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);
    const aura = named(game, game.battlefield, "Holy Strength");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Disenchant"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[aura].zone).toBe("graveyard");
    expect(
      game.eventsOfType("permanent-destroyed").some(
        (e) => e.object === aura && e.reason.includes("attached"),
      ),
    ).toBe(true);
  });

  it("fizzles (never attaches) if its target is gone by the time it resolves", () => {
    const game = mkGame(["Plains", "Holy Strength"], ["Lightning Bolt"]);
    const bear = spawn(game, "Grizzly Bears", A); // 2/2, dies to Bolt
    spawn(game, "Mountain", B); // untapped, ready to pay for the Bolt
    game.advanceUntil(atFirstMain);
    playLands(game, A, 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Holy Strength"),
      targets: [{ kind: "object", object: bear }],
    });
    // Alice passes so Bob can respond; he Bolts the target before Holy Strength resolves.
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: named(game, game.handOf(B), "Lightning Bolt"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(
      game.eventsOfType("spell-fizzled").some((e) => e.reason.includes("illegal")),
    ).toBe(true);
    const aura = game
      .graveyardOf(A)
      .find((id) => game.state.objects[id].cardName === "Holy Strength");
    expect(aura).toBeDefined();
    expect(game.battlefield).not.toContain(aura);
    expect(game.state.objects[aura as ObjectId].attachedTo).toBeNull();
  });
});

describe("Equipment", () => {
  it("Equip attaches it to a creature you control and grants its bonus", () => {
    const game = mkGame(["Plains", "Bonesplitter"]);
    const bear = spawn(game, "Grizzly Bears", A); // 2/2
    game.advanceUntil(atFirstMain);
    playLands(game, A, 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Bonesplitter"),
    });
    game.advanceUntil(stackEmpty);
    const equipment = named(game, game.battlefield, "Bonesplitter");
    expect(game.state.objects[equipment].attachedTo).toBeNull();
    expect(game.characteristics(bear)).toMatchObject({ power: 2, toughness: 2 });

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: equipment,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[equipment].attachedTo).toBe(bear);
    expect(game.characteristics(bear)).toMatchObject({ power: 4, toughness: 2 });
  });

  it("rejects equipping a creature you don't control", () => {
    const game = mkGame(["Plains", "Bonesplitter"]);
    spawn(game, "Grizzly Bears", A);
    const opposingBear = spawn(game, "Grizzly Bears", B);
    game.advanceUntil(atFirstMain);
    playLands(game, A, 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Bonesplitter"),
    });
    game.advanceUntil(stackEmpty);
    const equipment = named(game, game.battlefield, "Bonesplitter");

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: equipment,
        abilityIndex: 0,
        targets: [{ kind: "object", object: opposingBear }],
      }),
    ).toThrow(/illegal target/);
  });

  it("Equip only functions as a sorcery", () => {
    const game = mkGame(["Plains", "Bonesplitter"]);
    const bear = spawn(game, "Grizzly Bears", A);
    game.advanceUntil(atFirstMain);
    playLands(game, A, 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Bonesplitter"),
    });
    game.advanceUntil(stackEmpty);
    const equipment = named(game, game.battlefield, "Bonesplitter");

    // Bob's turn, but Alice holds priority (he's already passed).
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: equipment,
        abilityIndex: 0,
        targets: [{ kind: "object", object: bear }],
      }),
    ).toThrow(/own turn/);
  });

  it("stays on the battlefield, unattached, once its creature dies", () => {
    const game = mkGame(["Plains", "Bonesplitter", "Lightning Bolt"]);
    const bear = spawn(game, "Grizzly Bears", A); // 2/2
    game.advanceUntil(atFirstMain);
    playLands(game, A, 1);
    // Spawned after the Plains, so generic costs prefer the Plains and leave
    // this reserved for the Bolt's {R}.
    spawn(game, "Mountain", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Bonesplitter"),
    });
    game.advanceUntil(stackEmpty);
    const equipment = named(game, game.battlefield, "Bonesplitter");

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: equipment,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[equipment].attachedTo).toBe(bear);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[equipment].zone).toBe("battlefield");
    expect(game.state.objects[equipment].attachedTo).toBeNull();
  });
});
