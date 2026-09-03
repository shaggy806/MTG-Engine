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
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    timestamp: 0,
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
const drawsBy = (game: Game, player: PlayerId): number =>
  game.eventsOfType("card-drawn").filter((e) => e.player === player).length;

describe("triggered abilities", () => {
  it("an ETB trigger goes on the stack and resolves", () => {
    const game = mkGame(["Forest", "Forest", "Elvish Visionary"]);
    game.advanceUntil(atFirstMain);
    const [f1, f2] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: f1 });
    game.dispatch({ type: "play-land", player: A, card: f2 });
    const visionary = named(game, game.handOf(A), "Elvish Visionary");

    const before = drawsBy(game, A);
    game.dispatch({ type: "cast-spell", player: A, card: visionary });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[visionary].zone).toBe("battlefield");
    expect(game.eventsOfType("ability-triggered")).toHaveLength(1);
    expect(drawsBy(game, A)).toBe(before + 1);
  });

  it("a dies trigger fires and deals damage to a chosen target", () => {
    const game = mkGame(["Mountain", "Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    const ghoul = spawn(game, "Vengeful Ghoul", B);
    const bolt = named(game, game.handOf(A), "Lightning Bolt");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: ghoul }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[ghoul].zone).toBe("graveyard");
    expect(
      game.eventsOfType("ability-triggered").some((e) => e.source === ghoul),
    ).toBe(true);
    expect(
      game
        .eventsOfType("damage-dealt")
        .some((e) => e.source === ghoul && e.amount === 2),
    ).toBe(true);
  });

  it("an upkeep trigger fires only on the controller's upkeep", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const arena = spawn(game, "Phyrexian Arena", A);
    const lifeBefore = game.state.players[A].life;
    const drawsBefore = drawsBy(game, A);

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");

    // Bob's turn-2 upkeep must not have triggered it; Alice's turn-3 upkeep did.
    expect(game.state.players[A].life).toBe(lifeBefore - 1);
    expect(drawsBy(game, A)).toBe(drawsBefore + 1 /* upkeep */ + 1 /* draw step */);
    expect(
      game.eventsOfType("ability-triggered").filter((e) => e.source === arena),
    ).toHaveLength(1);
  });
});

describe("P/T layer", () => {
  it("a +1/+1 counter raises power and toughness", () => {
    const game = mkGame(["Forest", "Forest"]);
    game.advanceUntil(atFirstMain);
    const [f1, f2] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: f1 });
    game.dispatch({ type: "play-land", player: A, card: f2 });
    const sentinel = spawn(game, "Wildwood Sentinel", A);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: sentinel,
      abilityIndex: 0,
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[sentinel].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(sentinel)).toMatchObject({
      power: 3,
      toughness: 3,
    });
  });

  it("Giant Growth is +3/+3 until end of turn", () => {
    const game = mkGame(["Forest", "Giant Growth"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    const bear = spawn(game, "Grizzly Bears", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Giant Growth"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);
    expect(game.characteristics(bear)).toMatchObject({ power: 5, toughness: 5 });

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.characteristics(bear)).toMatchObject({ power: 2, toughness: 2 });
    expect(game.eventsOfType("pt-modifier-expired").length).toBeGreaterThan(0);
  });

  it("a pumped creature survives damage that would kill it unpumped", () => {
    const game = mkGame(["Forest", "Giant Growth", "Mountain", "Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    const [forest, , mountain] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: forest });
    game.dispatch({ type: "play-land", player: A, card: mountain });
    const bear = spawn(game, "Grizzly Bears", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Giant Growth"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.state.objects[bear].damageMarked).toBe(3);
  });
});

describe("snapshot / regression", () => {
  it("snapshots and restores with a triggered ability on the stack", () => {
    const game = mkGame(["Forest", "Forest", "Elvish Visionary"]);
    game.advanceUntil(atFirstMain);
    const [f1, f2] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: f1 });
    game.dispatch({ type: "play-land", player: A, card: f2 });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Elvish Visionary"),
    });
    game.advanceUntil(
      (s) =>
        s.zones.shared.stack.length === 1 &&
        s.objects[s.zones.shared.stack[0]].kind === "ability",
    );

    const snap = game.snapshot();
    const restored = Game.fromSnapshot(snap);
    expect(restored.state).toEqual(snap);

    restored.advanceUntil(stackEmpty);
    game.advanceUntil(stackEmpty);
    expect(restored.handOf(A).length).toBe(game.handOf(A).length);
  });

  it("advance() with default controllers still finishes a game", () => {
    const game = mkGame(["Elvish Visionary", "Phyrexian Arena"]);
    game.advance();
    expect(game.isOver).toBe(true);
  });
});
