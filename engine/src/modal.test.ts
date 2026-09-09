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
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

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

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
  return id;
};

describe("a castModal spell cast from an alternative zone (Snapcaster-style flashback)", () => {
  it("still carries its castModal descriptor and resolves with cast-time modes", () => {
    const { game } = scriptedGame([]);
    game.advanceUntil(toPrecombat);
    for (const land of ["Plains", "Island", "Swamp"]) spawn(game, land, A);
    const charm = game.debugSpawn("Sunder Charm", A, "graveyard");
    game.state.objects[charm].grantedFlashback = { cost: "{W}{U}{B}", untilEndOfTurn: true };

    const flash = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && x.card === charm && x.via === "flashback");
    expect(flash).toBeDefined();
    // The bug this guards: the alt-zone cast-spell loops used to omit castModal.
    expect((flash as { castModal?: unknown }).castModal).toBeDefined();

    const handBefore = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: charm,
      via: "flashback",
      modes: [2], // "You draw a card."
      targets: [],
    });
    game.advanceUntil(settled);

    expect(game.handOf(A).length).toBe(handBefore + 1);
    // A flashback spell is exiled, not put back in the graveyard.
    expect(game.state.zones.shared.exile).toContain(charm);
  });
});

describe("modal spells (rule 700.2) — Deliberate Course", () => {
  it("the game pauses on a choose-modes decision as the spell resolves", () => {
    const { game } = scriptedGame(["Deliberate Course"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Island", A);
    spawn(game, "Island", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Deliberate Course"),
    });
    game.advanceUntil((s) => s.awaiting !== null);

    expect(game.state.awaiting).toMatchObject({ kind: "choose-modes", player: A });
    const legal = game.legalActions(A);
    expect(legal).toHaveLength(1);
    expect(legal[0]).toMatchObject({
      kind: "choose-modes",
      minModes: 1,
      maxModes: 1,
      modeTexts: ["Draw two cards.", "You gain 5 life.", "Proliferate."],
    });
  });

  it("mode 0 draws two cards", () => {
    const { game } = scriptedGame(["Deliberate Course"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Island", A);
    spawn(game, "Island", A);
    const before = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Deliberate Course"),
    });
    game.advanceUntil((s) => s.awaiting !== null);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(settled);

    // -1 for the card cast, +2 drawn.
    expect(game.handOf(A).length).toBe(before - 1 + 2);
  });

  it("mode 1 gains 5 life", () => {
    const { game } = scriptedGame(["Deliberate Course"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Island", A);
    spawn(game, "Island", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Deliberate Course"),
    });
    game.advanceUntil((s) => s.awaiting !== null);
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    game.advanceUntil(settled);

    expect(game.state.players[A].life).toBe(25);
  });

  it("rejects choosing two modes when only one is allowed", () => {
    const { game } = scriptedGame(["Deliberate Course"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Island", A);
    spawn(game, "Island", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Deliberate Course"),
    });
    game.advanceUntil((s) => s.awaiting !== null);

    expect(game.canDispatch({ type: "choose-modes", player: A, modes: [0, 1] })).not.toBeNull();
    expect(game.canDispatch({ type: "choose-modes", player: A, modes: [] })).not.toBeNull();
    expect(game.canDispatch({ type: "choose-modes", player: A, modes: [0] })).toBeNull();
  });

  it("a ScriptedController answers via chooseModesFn", () => {
    const { game, a } = scriptedGame(["Deliberate Course"]);
    a.chooseModesFn = () => [1];
    game.advanceUntil(toPrecombat);
    spawn(game, "Island", A);
    spawn(game, "Island", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Deliberate Course"),
    });
    game.advanceUntil(settled);

    expect(game.state.players[A].life).toBe(25);
  });
});
