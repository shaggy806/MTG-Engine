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

const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
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
  if (played < n) throw new Error(`only ${played} ${name} available, needed ${n}`);
};

describe("enters-the-battlefield replacements (rule 614.1c)", () => {
  it("a tapland enters tapped and can't tap for mana that turn", () => {
    const game = mkGame(["Tranquil Thicket"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Tranquil Thicket"),
    });
    const thicket = named(game, game.battlefield, "Tranquil Thicket");

    expect(game.state.objects[thicket].tapped).toBe(true);
    const canTap = game
      .legalActions(A)
      .some((x) => x.kind === "activate-ability" && x.source === thicket);
    expect(canTap).toBe(false);
  });

  it("the tapland untaps on its controller's next turn", () => {
    const game = mkGame(["Tranquil Thicket"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Tranquil Thicket"),
    });
    const thicket = named(game, game.battlefield, "Tranquil Thicket");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");

    expect(game.state.objects[thicket].tapped).toBe(false);
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === thicket),
    ).toBe(true);
  });

  it("Walking Ballista enters with X +1/+1 counters", () => {
    const game = mkGame(["Walking Ballista"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 6);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Walking Ballista"),
      xValue: 3,
    });
    game.advanceUntil(stackEmpty);

    const ballista = named(game, game.battlefield, "Walking Ballista");
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(3);
    expect(game.characteristics(ballista)).toMatchObject({ power: 3, toughness: 3 });
  });

  it("Walking Ballista cast for X=0 is a 0/0 that dies, and loses its X", () => {
    const game = mkGame(["Walking Ballista"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Walking Ballista"),
      xValue: 0,
    });
    game.advanceUntil(stackEmpty);

    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Walking Ballista"),
    ).toBe(false);
    const dead = named(game, game.state.zones.perPlayer[A].graveyard, "Walking Ballista");
    expect(game.state.objects[dead].xValue).toBe(null);
  });

  it("its {4} ability still adds a counter after it enters", () => {
    const game = mkGame(["Walking Ballista"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 6);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Walking Ballista"),
      xValue: 1,
    });
    game.advanceUntil(stackEmpty);
    const ballista = named(game, game.battlefield, "Walking Ballista");
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(1);

    game.dispatch({ type: "activate-ability", player: A, source: ballista, abilityIndex: 0 });
    game.advanceUntil(stackEmpty);

    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(2);
    expect(game.characteristics(ballista)).toMatchObject({ power: 2, toughness: 2 });
  });
});

// --- Phase 1b: damage / token / counter / graveyard replacements -----------

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
    copyOf: null,
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const scriptedGame = (aCards: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

describe("Fog — combat-damage prevention (rule 614)", () => {
  it("prevents all combat damage for the turn", () => {
    const { game, a } = scriptedGame(["Fog"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Forest", A);
    const bears = spawn(game, "Grizzly Bears", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Fog"),
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.preventAllCombatDamage).toBe(true);

    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(20);
    expect(game.eventsOfType("damage-prevented").length).toBeGreaterThan(0);
  });

  it("the shield lapses on the next turn", () => {
    const { game } = scriptedGame(["Fog"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Forest", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Fog"),
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.preventAllCombatDamage).toBe(true);

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.state.preventAllCombatDamage).toBe(false);
  });
});

describe("Doubling Season — token & counter multipliers (rule 614)", () => {
  it("doubles tokens an effect would create", () => {
    const { game } = scriptedGame(["Raise the Alarm"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Doubling Season", A);
    spawn(game, "Plains", A);
    spawn(game, "Plains", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Raise the Alarm"),
    });
    game.advanceUntil(stackEmpty);

    const soldiers = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Soldier Token",
    );
    expect(soldiers.length).toBe(4);
  });

  it("doubles the +1/+1 counters an X creature enters with", () => {
    const { game } = scriptedGame(["Walking Ballista"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Doubling Season", A);
    for (let i = 0; i < 4; i += 1) spawn(game, "Mountain", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Walking Ballista"),
      xValue: 2,
    });
    game.advanceUntil(stackEmpty);

    const ballista = named(game, game.battlefield, "Walking Ballista");
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(4);
    expect(game.characteristics(ballista)).toMatchObject({ power: 4, toughness: 4 });
  });

  it("doubles counters added by an activated ability", () => {
    const { game } = scriptedGame(["Walking Ballista"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Doubling Season", A);
    for (let i = 0; i < 8; i += 1) spawn(game, "Mountain", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Walking Ballista"),
      xValue: 1,
    });
    game.advanceUntil(stackEmpty);
    const ballista = named(game, game.battlefield, "Walking Ballista");
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(2);

    game.dispatch({ type: "activate-ability", player: A, source: ballista, abilityIndex: 0 });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(4);
  });
});

describe("Rest in Peace — graveyard replacement (rule 614)", () => {
  it("exiles a creature that would die instead of putting it in the graveyard", () => {
    const { game } = scriptedGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Rest in Peace", A);
    spawn(game, "Mountain", A);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.zones.perPlayer[B].graveyard).not.toContain(bears);
    expect(game.eventsOfType("graveyard-replaced-with-exile").length).toBeGreaterThan(0);
  });

  it("exiles a spell that would be put into the graveyard after resolving", () => {
    const { game } = scriptedGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Rest in Peace", A);
    spawn(game, "Mountain", A);
    const bolt = named(game, game.handOf(A), "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(17);
    expect(game.state.objects[bolt].zone).toBe("exile");
  });
});
