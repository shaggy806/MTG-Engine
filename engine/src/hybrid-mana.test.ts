import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[], filler: string): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill(filler),
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

const scriptedGame = (aCards: readonly string[], filler = "Mountain") => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards, filler) },
      { player: B, cards: pad([], "Forest") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const canCast = (game: Game, name: string): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.cardName === name);

describe("Phyrexian mana — Gut Shot ({R/P})", () => {
  it("pays the {R} half from a red source, losing no life", () => {
    const { game } = scriptedGame(["Gut Shot"]);
    game.advanceUntil(toPrecombat);
    const mountain = spawn(game, "Mountain", A);
    const bear = spawn(game, "Grizzly Bears", B);
    const lifeBefore = game.state.players[A].life;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Gut Shot"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[mountain].tapped).toBe(true);
    expect(game.state.players[A].life).toBe(lifeBefore);
    expect(game.state.objects[bear].damageMarked).toBe(1);
  });

  it("pays 2 life when no coloured mana is available", () => {
    const { game } = scriptedGame(["Gut Shot"], "Forest");
    game.advanceUntil(toPrecombat);
    spawn(game, "Forest", A);
    const bear = spawn(game, "Grizzly Bears", B);
    const lifeBefore = game.state.players[A].life;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Gut Shot"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);

    expect(game.state.players[A].life).toBe(lifeBefore - 2);
    expect(game.state.objects[bear].damageMarked).toBe(1);
  });

  it("is uncastable with no red mana and too little life to pay the Phyrexian pip", () => {
    const { game } = scriptedGame(["Gut Shot"], "Forest");
    game.advanceUntil(toPrecombat);
    spawn(game, "Forest", A);
    spawn(game, "Grizzly Bears", B);
    game.state.players[A].life = 2;

    expect(canCast(game, "Gut Shot")).toBe(false);
  });
});

describe("Twobrid mana — Flame Javelin ({2/R}{2/R}{2/R})", () => {
  it("prefers the {R} half over paying two generic per pip", () => {
    const { game } = scriptedGame(["Flame Javelin"]);
    game.advanceUntil(toPrecombat);
    const mountains = [
      spawn(game, "Mountain", A),
      spawn(game, "Mountain", A),
      spawn(game, "Mountain", A),
    ];
    const forests = [
      spawn(game, "Forest", A),
      spawn(game, "Forest", A),
      spawn(game, "Forest", A),
    ];
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Flame Javelin"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);

    expect(mountains.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(forests.every((id) => !game.state.objects[id].tapped)).toBe(true);
    expect(game.state.zones.perPlayer[B].graveyard).toContain(bear);
  });

  it("falls back to six generic mana when no red is available", () => {
    const { game } = scriptedGame(["Flame Javelin"], "Forest");
    game.advanceUntil(toPrecombat);
    const forests = Array.from({ length: 6 }, () => spawn(game, "Forest", A));
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Flame Javelin"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);

    expect(forests.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(game.state.zones.perPlayer[B].graveyard).toContain(bear);
  });

  it("is uncastable with only five mana", () => {
    const { game } = scriptedGame(["Flame Javelin"], "Forest");
    game.advanceUntil(toPrecombat);
    Array.from({ length: 5 }, () => spawn(game, "Forest", A));
    spawn(game, "Grizzly Bears", B);

    expect(canCast(game, "Flame Javelin")).toBe(false);
  });
});

describe("Hybrid mana — Wilt-Leaf Cavaliers ({2}{G/W}{G/W})", () => {
  it("pays each hybrid pip from whichever colour is on hand", () => {
    const { game } = scriptedGame(["Wilt-Leaf Cavaliers"], "Forest");
    game.advanceUntil(toPrecombat);
    Array.from({ length: 4 }, () => spawn(game, "Forest", A));

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Wilt-Leaf Cavaliers"),
    });
    game.advanceUntil(settled);

    expect(
      game.battlefield.some(
        (id) => game.state.objects[id].cardName === "Wilt-Leaf Cavaliers",
      ),
    ).toBe(true);
    expect(
      game.battlefield.filter(
        (id) =>
          game.state.objects[id].cardName === "Forest" &&
          game.state.objects[id].tapped,
      ).length,
    ).toBe(4);
  });
});
