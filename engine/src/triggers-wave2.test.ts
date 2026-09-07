import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const pad = (cards: readonly string[], filler = "Forest"): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill(filler),
];

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const mkGame = (players: readonly PlayerId[], aHand: readonly string[] = []) => {
  const controllers: Record<string, ScriptedController> = {};
  for (const p of players) controllers[p] = new ScriptedController(p);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((p) => ({
      player: p,
      cards: p === A ? pad(aHand) : pad([]),
    })),
  });
  return { game, controllers };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id]?.zone ?? "gone";
const castA = (game: Game, name: string): void => {
  game.dispatch({ type: "cast-spell", player: A, card: named(game, game.handOf(A), name) });
};

describe("broad enters-battlefield trigger — Soul Warden", () => {
  it("gains life when another creature enters, not for a non-creature", () => {
    const { game } = mkGame([A, B], ["Grizzly Bears", "Glorious Anthem"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Soul Warden", A);
    for (let i = 0; i < 3; i += 1) spawn(game, "Plains", A);
    for (let i = 0; i < 3; i += 1) spawn(game, "Forest", A);
    const life0 = game.state.players[A].life;

    castA(game, "Grizzly Bears");
    game.advanceUntil(settled);
    expect(game.state.players[A].life).toBe(life0 + 1);

    castA(game, "Glorious Anthem"); // an enchantment — no trigger
    game.advanceUntil(settled);
    expect(game.state.players[A].life).toBe(life0 + 1);
  });

  it("does not fire for the Warden's own entry (otherOnly)", () => {
    const { game } = mkGame([A, B], ["Soul Warden"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Plains", A);
    const life0 = game.state.players[A].life;

    game.dispatch({ type: "cast-spell", player: A, card: named(game, game.handOf(A), "Soul Warden") });
    game.advanceUntil(settled);
    expect(game.state.players[A].life).toBe(life0);
  });
});

describe("broad dies trigger — Zulaport Cutthroat / Grave Pact", () => {
  const boltA = (game: Game, target: ObjectId): void => {
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: target }],
    });
  };

  it("Zulaport drains each opponent and gains you life when your creature dies (3p)", () => {
    const { game } = mkGame([A, B, C], ["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Zulaport Cutthroat", A);
    const bears = spawn(game, "Grizzly Bears", A);
    spawn(game, "Mountain", A);
    const lifeA = game.state.players[A].life;

    boltA(game, bears);
    game.advanceUntil(settled);

    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(game.state.players[A].life).toBe(lifeA + 1);
    expect(game.state.players[B].life).toBe(19);
    expect(game.state.players[C].life).toBe(19);
  });

  it("Grave Pact makes each opponent sacrifice a creature when your creature dies", () => {
    const { game } = mkGame([A, B], ["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Grave Pact", A);
    const mine = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Raging Goblin", B);
    spawn(game, "Mountain", A);

    boltA(game, mine);
    game.advanceUntil(settled);

    expect(zoneOf(game, mine)).toBe("graveyard");
    expect(zoneOf(game, theirs)).toBe("graveyard");
  });
});

describe("gains-life trigger — Ajani's Pridemate", () => {
  it("grows when you gain life", () => {
    const { game } = mkGame([A, B], ["Grizzly Bears", "Craw Wurm"]);
    game.advanceUntil(toPrecombat);
    const pridemate = spawn(game, "Ajani's Pridemate", A);
    spawn(game, "Soul Warden", A); // a life-gain source (fires on another creature)
    for (let i = 0; i < 12; i += 1) spawn(game, "Forest", A);

    castA(game, "Grizzly Bears");
    game.advanceUntil(settled);
    expect(game.state.objects[pridemate].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(pridemate)).toMatchObject({ power: 3, toughness: 3 });

    castA(game, "Craw Wurm");
    game.advanceUntil(settled);
    expect(game.state.objects[pridemate].counters["+1/+1"]).toBe(2);
  });
});

describe("landfall — Rampaging Baloths", () => {
  it("offers a Beast token when a land enters under your control", () => {
    const a = new ScriptedController(A);
    a.chooseModesFn = () => [0]; // accept the "you may"
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: pad(["Forest", "Forest"]) },
        { player: B, cards: pad([]) },
      ],
    });
    game.advanceUntil(toPrecombat);
    spawn(game, "Rampaging Baloths", A);

    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Forest"),
    });
    game.advanceUntil(settled);

    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Beast Token"),
    ).toBe(true);
  });

  it("does not fire for an opponent's land (who: you-control)", () => {
    const a = new ScriptedController(A);
    a.chooseModesFn = () => [0];
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: pad([]) },
        { player: B, cards: pad(["Forest"], "Mountain") },
      ],
    });
    game.advanceUntil(toPrecombat);
    spawn(game, "Rampaging Baloths", A);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    game.dispatch({
      type: "play-land",
      player: B,
      card: named(game, game.handOf(B), "Forest"),
    });
    game.advanceUntil(settled);

    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Beast Token"),
    ).toBe(false);
  });
});
