import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
];

const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
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
    summoningSick: false, loyaltyActivatedThisTurn: false,
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
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

describe("Sol Ring — a multi-mana source", () => {
  it("taps once to pay a whole {2} cost", () => {
    const { game } = scriptedGame(["Prosperous Innkeeper"]);
    game.advanceUntil(toPrecombat);
    const ring = spawn(game, "Sol Ring", A);
    const forest = spawn(game, "Forest", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Prosperous Innkeeper"),
    });
    game.advanceUntil(settled);

    // Sol Ring covered {2}, the Forest covered {G} — both tapped, nothing else.
    expect(game.state.objects[ring].tapped).toBe(true);
    expect(game.state.objects[forest].tapped).toBe(true);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Prosperous Innkeeper"),
    ).toBe(true);
  });

  it("counts both its mana toward the largest affordable {X}", () => {
    const { game } = scriptedGame(["Fireball"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Sol Ring", A);
    spawn(game, "Mountain", A);

    const fireball = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && x.cardName === "Fireball");
    expect(fireball?.kind === "cast-spell" && fireball.xCost?.maxX).toBe(2);
  });
});

describe("any-color sources", () => {
  it("Arcane Signet pays a colored pip no land in the deck could", () => {
    const { game } = scriptedGame(["Soul Warden"]);
    game.advanceUntil(toPrecombat);
    const signet = spawn(game, "Arcane Signet", A); // deck is all Mountains

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Soul Warden"),
    });
    game.advanceUntil(settled);

    expect(game.state.objects[signet].tapped).toBe(true);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Soul Warden"),
    ).toBe(true);
  });

  it("Command Tower is a land that taps for any color", () => {
    const { game } = scriptedGame(["Command Tower", "Soul Warden"]);
    game.advanceUntil(toPrecombat);
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Command Tower"),
    });
    const tower = named(game, game.battlefield, "Command Tower");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Soul Warden"),
    });
    game.advanceUntil(settled);

    expect(game.state.objects[tower].tapped).toBe(true);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Soul Warden"),
    ).toBe(true);
  });
});

describe("Treasure tokens", () => {
  it("are sacrificed for one mana of any color and then cease to exist", () => {
    const { game } = scriptedGame(["Soul Warden"]);
    game.advanceUntil(toPrecombat);
    const treasure = spawn(game, "Treasure Token", A);
    game.state.objects[treasure].isToken = true;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Soul Warden"),
    });
    game.advanceUntil(settled);

    // The Treasure paid the {W} and is gone (rule 111.7 — a token off the
    // battlefield ceases to exist).
    expect(game.state.objects[treasure]).toBeUndefined();
    expect(game.eventsOfType("permanent-sacrificed").length).toBeGreaterThan(0);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Soul Warden"),
    ).toBe(true);
  });

  it("Prosperous Innkeeper makes a Treasure on entry and gains life on later creatures", () => {
    const { game } = scriptedGame(["Prosperous Innkeeper", "Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Sol Ring", A);
    spawn(game, "Forest", A);
    spawn(game, "Forest", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Prosperous Innkeeper"),
    });
    game.advanceUntil(settled);
    expect(
      game.battlefield.filter((id) => game.state.objects[id].cardName === "Treasure Token").length,
    ).toBe(1);

    const lifeBefore = game.state.players[A].life;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Grizzly Bears"),
    });
    game.advanceUntil(settled);
    expect(game.state.players[A].life).toBe(lifeBefore + 1);
  });
});
