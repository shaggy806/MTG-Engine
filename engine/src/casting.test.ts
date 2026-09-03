import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { poolTotal } from "./mana.js";
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

/** White-box: drop a permanent straight onto the battlefield for a test. */
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
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

describe("playing lands", () => {
  it("puts a land onto the battlefield and counts the land drop", () => {
    const game = mkGame(["Forest"]);
    game.advanceUntil(atFirstMain);
    const forest = game.handOf(A)[0];
    game.dispatch({ type: "play-land", player: A, card: forest });
    expect(game.state.objects[forest].zone).toBe("battlefield");
    expect(game.state.players[A].landsPlayedThisTurn).toBe(1);
    expect(game.eventsOfType("land-played")).toHaveLength(1);
  });

  it("rejects a second land in one turn", () => {
    const game = mkGame(["Forest", "Forest"], [], { rules: { maxLandsPerTurn: 1 } });
    game.advanceUntil(atFirstMain);
    const [f1, f2] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: f1 });
    expect(() => game.dispatch({ type: "play-land", player: A, card: f2 })).toThrow(
      /already played a land/,
    );
  });

  it("rejects a land outside a main phase", () => {
    const game = mkGame(["Forest"]);
    game.advanceUntil((s) => s.turn.step === "upkeep");
    expect(() =>
      game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] }),
    ).toThrow(/main phase/);
  });
});

describe("casting a creature", () => {
  it("goes on the stack, is auto-paid, and resolves to the battlefield", () => {
    const game = mkGame(["Forest", "Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    const [f1, f2] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: f1 });
    game.dispatch({ type: "play-land", player: A, card: f2 });
    const bears = cardNamed(game, game.handOf(A), "Grizzly Bears");

    game.dispatch({ type: "cast-spell", player: A, card: bears });
    expect(game.stack).toEqual([bears]);
    expect(game.state.objects[bears].zone).toBe("stack");
    expect(game.eventsOfType("spell-cast")).toHaveLength(1);

    game.advanceUntil(stackEmpty);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(poolTotal(game.state.players[A].manaPool)).toBe(0);
    expect(
      game.battlefield
        .filter((id) => game.state.objects[id].cardName === "Forest")
        .every((id) => game.state.objects[id].tapped),
    ).toBe(true);
  });

  it("untaps the lands on the caster's next turn", () => {
    const game = mkGame(["Forest", "Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    const [f1, f2] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: f1 });
    game.dispatch({ type: "play-land", player: A, card: f2 });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Grizzly Bears"),
    });
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect([f1, f2].every((id) => !game.state.objects[id].tapped)).toBe(true);
  });

  it("rejects a cast with too little mana", () => {
    const game = mkGame(["Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    const bears = cardNamed(game, game.handOf(A), "Grizzly Bears");
    expect(() => game.dispatch({ type: "cast-spell", player: A, card: bears })).toThrow(
      /cannot pay/,
    );
  });

  it("rejects a creature cast at instant speed", () => {
    const game = mkGame(["Forest", "Forest", "Grizzly Bears"]);
    game.advanceUntil((s) => s.turn.step === "upkeep");
    const bears = cardNamed(game, game.handOf(A), "Grizzly Bears");
    expect(() => game.dispatch({ type: "cast-spell", player: A, card: bears })).toThrow(
      /main phase/,
    );
  });

  it("returns priority to the active player after a resolution", () => {
    const game = mkGame(["Forest", "Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    const [f1, f2] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: f1 });
    game.dispatch({ type: "play-land", player: A, card: f2 });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Grizzly Bears"),
    });
    game.advanceUntil(stackEmpty);
    const resolvedAt = game.events.findIndex((e) => e.type === "spell-resolved");
    const nextPriority = game.events
      .slice(resolvedAt)
      .find((e) => e.type === "priority-received");
    expect(nextPriority?.player).toBe(A);
  });
});

describe("Lightning Bolt", () => {
  const setupBolt = (extraLands = 1) => {
    const game = mkGame([
      ...Array(extraLands).fill("Mountain"),
      "Lightning Bolt",
      "Lightning Bolt",
    ]);
    game.advanceUntil(atFirstMain);
    const mountains = game
      .handOf(A)
      .filter((id) => game.state.objects[id].cardName === "Mountain")
      .slice(0, extraLands);
    for (const m of mountains) game.dispatch({ type: "play-land", player: A, card: m });
    return game;
  };

  it("kills a creature with lethal damage", () => {
    const game = setupBolt(1);
    const bear = spawn(game, "Grizzly Bears", B);
    const bolt = cardNamed(game, game.handOf(A), "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(
      game.eventsOfType("permanent-destroyed").some((e) => e.object === bear),
    ).toBe(true);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });

  it("marks non-lethal damage that clears in cleanup", () => {
    const game = setupBolt(1);
    const baloth = spawn(game, "Rumbling Baloth", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: baloth }],
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[baloth].damageMarked).toBe(3);
    expect(game.state.objects[baloth].zone).toBe("battlefield");

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[baloth].damageMarked).toBe(0);
    expect(game.eventsOfType("damage-cleared").length).toBeGreaterThan(0);
  });

  it("deals 3 to a player", () => {
    const game = setupBolt(1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.players[B].life).toBe(17);
    expect(
      game
        .eventsOfType("life-changed")
        .some((e) => e.player === B && e.delta === -3 && e.life === 17),
    ).toBe(true);
  });

  it("fizzles when its only target is gone by resolution", () => {
    const game = setupBolt(2);
    const bear = spawn(game, "Grizzly Bears", B);
    const bolts = game
      .handOf(A)
      .filter((id) => game.state.objects[id].cardName === "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolts[0],
      targets: [{ kind: "object", object: bear }],
    });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolts[1],
      targets: [{ kind: "object", object: bear }],
    });
    expect(game.stack).toHaveLength(2);

    game.advanceUntil(stackEmpty);
    // bolts[1] resolves first and kills the bear; bolts[0] then fizzles.
    expect(game.eventsOfType("spell-resolved").some((e) => e.object === bolts[1])).toBe(
      true,
    );
    expect(game.eventsOfType("spell-fizzled").some((e) => e.object === bolts[0])).toBe(
      true,
    );
    expect(game.state.objects[bolts[0]].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20);
  });

  it("resolves the stack last-in-first-out", () => {
    const game = setupBolt(2);
    const bolts = game
      .handOf(A)
      .filter((id) => game.state.objects[id].cardName === "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolts[0],
      targets: [{ kind: "player", player: B }],
    });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolts[1],
      targets: [{ kind: "player", player: A }],
    });
    game.advanceUntil(stackEmpty);
    const order = game.eventsOfType("spell-resolved").map((e) => e.object);
    expect(order.indexOf(bolts[1])).toBeLessThan(order.indexOf(bolts[0]));
  });

  it("rejects an illegal target at cast time", () => {
    const game = setupBolt(1);
    const bolt = cardNamed(game, game.handOf(A), "Lightning Bolt");
    const landId = game.battlefield[0]; // a Mountain, not a legal "any target"
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: bolt,
        targets: [{ kind: "object", object: landId }],
      }),
    ).toThrow(/illegal target/);
  });
});

describe("snapshot with a spell on the stack", () => {
  it("restores and resolves identically", () => {
    const game = mkGame(["Forest", "Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    const [f1, f2] = game.handOf(A);
    game.dispatch({ type: "play-land", player: A, card: f1 });
    game.dispatch({ type: "play-land", player: A, card: f2 });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Grizzly Bears"),
    });
    expect(game.stack).toHaveLength(1);

    const snap = game.snapshot();
    const restored = Game.fromSnapshot(snap);
    expect(restored.state).toEqual(snap);

    restored.advanceUntil(stackEmpty);
    game.advanceUntil(stackEmpty);
    expect(restored.battlefield).toEqual(game.battlefield);
  });
});

describe("ScriptedController integration", () => {
  it("plays lands and casts a creature via a script", () => {
    const controller = new ScriptedController(A);
    const game = Game.create({
      seed: 3,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
      controllers: { [A]: controller },
      decks: [
        { player: A, cards: pad(["Forest", "Forest", "Grizzly Bears"]) },
        { player: B, cards: pad([]) },
      ],
    });
    const hand = game.handOf(A);
    const forests = hand
      .filter((id) => game.state.objects[id].cardName === "Forest")
      .slice(0, 2);
    const bears = cardNamed(game, hand, "Grizzly Bears");
    const inMyMain = (view: { state: GameState; player: PlayerId }): boolean =>
      view.state.turn.step === "precombat-main" &&
      view.state.turn.activePlayerIndex === 0;

    controller.enqueue(
      { action: { type: "play-land", player: A, card: forests[0] }, when: inMyMain },
      { action: { type: "play-land", player: A, card: forests[1] }, when: inMyMain },
      { action: { type: "cast-spell", player: A, card: bears }, when: inMyMain },
    );

    game.advanceUntil((s) => s.zones.shared.battlefield.includes(bears));
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });
});
