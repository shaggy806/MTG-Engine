import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
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

/** Spawn a permanent, giving it the next battlefield timestamp. */
const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { tapped?: boolean; sick?: boolean } = {},
): ObjectId => {
  game.state.timestampSeq += 1;
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
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: opts.sick ? game.state.turn.number : 0,
    summoningSick: opts.sick ?? false,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    counters: {},
    modifiers: [],
    timestamp: game.state.timestampSeq,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};

describe("Glorious Anthem", () => {
  it("gives your creatures +1/+1 but not the opponent's", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const mine = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Grizzly Bears", B);
    spawn(game, "Glorious Anthem", A);

    expect(pt(game, mine)).toEqual([3, 3]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });

  it("stacks with a +1/+1 counter and a Giant Growth", () => {
    const game = mkGame(["Forest", "Giant Growth"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    const bear = spawn(game, "Grizzly Bears", A);
    game.state.objects[bear].counters["+1/+1"] = 1;
    spawn(game, "Glorious Anthem", A);
    expect(pt(game, bear)).toEqual([4, 4]);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Giant Growth"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);
    expect(pt(game, bear)).toEqual([7, 7]);
  });

  it("two Anthems stack", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const bear = spawn(game, "Grizzly Bears", A);
    spawn(game, "Glorious Anthem", A);
    spawn(game, "Glorious Anthem", A);
    expect(pt(game, bear)).toEqual([4, 4]);
  });

  it("only affects permanents on the battlefield", () => {
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    spawn(game, "Glorious Anthem", A);
    const inHand = named(game, game.handOf(A), "Grizzly Bears");
    expect(pt(game, inHand)).toEqual([2, 2]);
  });

  it("a creature can die when the Anthem propping it up leaves", () => {
    const game = mkGame(["Plains", "Plains", "Disenchant"]);
    game.advanceUntil(atFirstMain);
    const [p1, p2] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: p1 });
    game.dispatch({ type: "play-land", player: A, card: p2 });

    const wall = spawn(game, "Wall of Wood", A); // 0/3
    game.state.objects[wall].damageMarked = 3;
    const anthem = spawn(game, "Glorious Anthem", A); // wall is now 1/4, survives
    expect(pt(game, wall)).toEqual([1, 4]);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Disenchant"),
      targets: [{ kind: "object", object: anthem }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[anthem].zone).toBe("graveyard");
    expect(game.state.objects[wall].zone).toBe("graveyard");
  });
});

describe("Goblin Chieftain (lord)", () => {
  it("buffs other Goblins you control, not itself or non-Goblins", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const chieftain = spawn(game, "Goblin Chieftain", A);
    const goblin = spawn(game, "Goblin Raider", A);
    const bear = spawn(game, "Grizzly Bears", A);
    const enemyGoblin = spawn(game, "Goblin Raider", B);

    expect(pt(game, chieftain)).toEqual([2, 2]);
    expect(pt(game, goblin)).toEqual([3, 3]);
    expect(game.characteristics(goblin).keywords.has("haste")).toBe(true);
    expect(pt(game, bear)).toEqual([2, 2]);
    expect(pt(game, enemyGoblin)).toEqual([2, 2]);
  });

  it("grants haste so a fresh Goblin can attack", () => {
    const attacker = new ScriptedController(A);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false },
      controllers: { [A]: attacker },
      decks: [
        { player: A, cards: pad([]) },
        { player: B, cards: pad([]) },
      ],
    });
    spawn(game, "Goblin Chieftain", A);
    const goblin = spawn(game, "Goblin Raider", A, { sick: true });
    attacker.declareAttackersFn = () => [{ attacker: goblin, defender: B }];

    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(17); // 3/3 with the lord bonus
  });
});

describe("keyword-granting statics and one-shots", () => {
  it("Levitation lets your ground creature fly over a ground blocker", () => {
    const attacker = new ScriptedController(A);
    const blocker = new ScriptedController(B);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false },
      controllers: { [A]: attacker, [B]: blocker },
      decks: [
        { player: A, cards: pad([]) },
        { player: B, cards: pad([]) },
      ],
    });
    spawn(game, "Levitation", A);
    const flier = spawn(game, "Grizzly Bears", A);
    const ground = spawn(game, "Grizzly Bears", B);
    attacker.declareAttackersFn = () => [{ attacker: flier, defender: B }];
    blocker.declareBlockersFn = () => [{ blocker: ground, attacker: flier }];

    expect(() => game.advanceUntil(toPostcombat)).toThrow(/flying/);
  });

  it("Jump grants flying until end of turn", () => {
    const game = mkGame(["Island", "Jump"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    const bear = spawn(game, "Grizzly Bears", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Jump"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);
    expect(game.characteristics(bear).keywords.has("flying")).toBe(true);

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.characteristics(bear).keywords.has("flying")).toBe(false);
  });
});

describe("snapshot / regression", () => {
  it("snapshots and restores with an Anthem and a pumped creature", () => {
    const game = mkGame(["Forest", "Giant Growth"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    const bear = spawn(game, "Grizzly Bears", A);
    spawn(game, "Glorious Anthem", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Giant Growth"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);

    const snap = game.snapshot();
    const restored = Game.fromSnapshot(snap);
    expect(restored.state).toEqual(snap);
    expect(restored.characteristics(bear)).toEqual(game.characteristics(bear));
  });

  it("advance() with default controllers still finishes a game", () => {
    const game = mkGame(["Glorious Anthem", "Goblin Chieftain"]);
    game.advance();
    expect(game.isOver).toBe(true);
  });
});
