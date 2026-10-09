import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[], land = "Forest") => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill(land)] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each]?.cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

describe("Zuran Orb — sacrifice a land as an activated-ability cost", () => {
  it("sacrifices the chosen land and gains 2 life", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Zuran Orb", A, "battlefield");
    const land = game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const life = game.state.players[A].life;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: named(game, game.battlefield, "Zuran Orb"),
      abilityIndex: 0,
      targets: [],
      sacrifice: land,
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[land].zone).toBe("graveyard");
    expect(game.state.players[A].life).toBe(life + 2);
  });

  it("is not offered with no land to sacrifice", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Zuran Orb", A, "battlefield");
    const acts = game
      .legalActions(A)
      .filter((x) => x.kind === "activate-ability");
    expect(acts).toHaveLength(0);
  });
});

describe("Sylvan Safekeeper — sac a land to grant shroud", () => {
  // Shroud, not hexproof: the printed card says shroud, and the difference
  // is that it stops the creature's own controller targeting it too.
  it("makes a creature you control untargetable", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Sylvan Safekeeper", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const land = game.debugSpawn("Forest", A, "battlefield");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: named(game, game.battlefield, "Sylvan Safekeeper"),
      abilityIndex: 0,
      targets: [{ kind: "object", object: bear }],
      sacrifice: land,
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[land].zone).toBe("graveyard");
    expect(game.characteristics(bear).keywords.has("shroud")).toBe(true);
    expect(game.characteristics(bear).keywords.has("hexproof")).toBe(false);
  });
});

describe("Korvold, Fae-Cursed King — the sacrifice trigger", () => {
  it("grows and draws whenever you sacrifice a permanent", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Korvold, Fae-Cursed King", A, "battlefield");
    game.debugSpawn("Zuran Orb", A, "battlefield");
    const land = game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const korvold = named(game, game.battlefield, "Korvold, Fae-Cursed King");
    const hand = game.handOf(A).length;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: named(game, game.battlefield, "Zuran Orb"),
      abilityIndex: 0,
      targets: [],
      sacrifice: land,
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[korvold].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(korvold).power).toBe(5);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  // Rule 603.10a: a sacrifice trigger looks back in time, so Korvold sees
  // his own sacrifice — the counter has nowhere to go, but he still draws.
  it("triggers on his own sacrifice", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const korvold = game.debugSpawn("Korvold, Fae-Cursed King", A, "battlefield");
    game.debugSpawn("Viscera Seer", A, "battlefield");
    const hand = game.handOf(A).length;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: named(game, game.battlefield, "Viscera Seer"),
      abilityIndex: 0,
      targets: [],
      sacrifice: korvold,
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[korvold].zone).toBe("graveyard");
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("sacrifices another permanent when it enters, then grows off that sac", () => {
    const { game } = mkGame(["Korvold, Fae-Cursed King"], "Swamp");
    game.advanceUntil(toPrecombat);
    for (const l of ["Swamp", "Swamp", "Mountain", "Mountain", "Forest", "Forest"]) {
      game.debugSpawn(l, A, "battlefield");
    }
    const landCount = game.battlefield.filter(
      (id) =>
        game.state.objects[id].controller === A &&
        game.characteristics(id).types.includes("land"),
    ).length;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Korvold, Fae-Cursed King"),
    });
    game.advanceUntil(quiet);

    const korvold = named(game, game.battlefield, "Korvold, Fae-Cursed King");
    expect(game.state.objects[korvold].counters["+1/+1"]).toBe(1); // ETB sac -> sac trigger
    const nowLands = game.battlefield.filter(
      (id) =>
        game.state.objects[id].controller === A &&
        game.characteristics(id).types.includes("land"),
    ).length;
    expect(nowLands).toBe(landCount - 1); // one land sacrificed to the ETB
  });
});

describe("Esoteric Duplicator — copies a sacrificed artifact at the next end step", () => {
  const tokenCopies = (game: Game, name: string): ObjectId[] =>
    game.battlefield.filter(
      (id) => game.state.objects[id].isToken && game.state.objects[id].cardName === name,
    );
  const toEndStep = (s: GameState): boolean => s.turn.number === 1 && s.turn.step === "end";

  it("copies itself when it's the one sacrificed (rule 603.10a)", () => {
    const { game, a } = mkGame([], "Island");
    a.chooseModesFn = () => [0];
    game.advanceUntil(toPrecombat);
    const duplicator = game.debugSpawn("Esoteric Duplicator", A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Island", A, "battlefield");
    const hand = game.handOf(A).length;

    game.dispatch({ type: "activate-ability", player: A, source: duplicator, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);

    expect(game.state.objects[duplicator].zone).toBe("graveyard");
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(tokenCopies(game, "Esoteric Duplicator")).toHaveLength(0);
    game.advanceUntil(toEndStep);
    game.advanceUntil(quiet);
    expect(tokenCopies(game, "Esoteric Duplicator")).toHaveLength(1);
  });

  it("copies another artifact sacrificed, and nothing when the {2} isn't paid", () => {
    for (const pay of [true, false]) {
      const { game, a } = mkGame([], "Island");
      a.chooseModesFn = () => (pay ? [0] : []);
      game.advanceUntil(toPrecombat);
      game.debugSpawn("Esoteric Duplicator", A, "battlefield");
      game.debugSpawn("Viscera Seer", A, "battlefield");
      const memnite = game.debugSpawn("Memnite", A, "battlefield");
      for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", A, "battlefield");

      game.dispatch({
        type: "activate-ability",
        player: A,
        source: named(game, game.battlefield, "Viscera Seer"),
        abilityIndex: 0,
        targets: [],
        sacrifice: memnite,
      });
      game.advanceUntil(quiet);
      expect(game.state.objects[memnite].zone).toBe("graveyard");
      game.advanceUntil(toEndStep);
      game.advanceUntil(quiet);
      expect(tokenCopies(game, "Memnite")).toHaveLength(pay ? 1 : 0);
      expect(tokenCopies(game, "Esoteric Duplicator")).toHaveLength(0);
    }
  });

  // A token sacrificed has ceased to exist by the end step; it's copied as it
  // last existed (rule 608.2h, the ruling).
  it("copies a sacrificed token", () => {
    const { game, a } = mkGame([], "Island");
    a.chooseModesFn = () => [0];
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Esoteric Duplicator", A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Island", A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: "Clue Token", count: 1 });
    const clue = tokenCopies(game, "Clue Token")[0];

    game.dispatch({ type: "activate-ability", player: A, source: clue, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(tokenCopies(game, "Clue Token")).toHaveLength(0);
    game.advanceUntil(toEndStep);
    game.advanceUntil(quiet);
    expect(tokenCopies(game, "Clue Token")).toHaveLength(1);
  });

  // Sacrificed during an end step, it's copied at the next turn's — after
  // the new turn has let go of the turn's ceased tokens.
  it("copies a token sacrificed in an end step at the next turn's end step", () => {
    const { game, a } = mkGame([], "Island");
    a.chooseModesFn = () => [0];
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Esoteric Duplicator", A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Island", A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: "Clue Token", count: 1 });
    const clue = tokenCopies(game, "Clue Token")[0];
    game.advanceUntil((s) => toEndStep(s) && s.priority.holder === A);

    game.dispatch({ type: "activate-ability", player: A, source: clue, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(tokenCopies(game, "Clue Token")).toHaveLength(0);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(tokenCopies(game, "Clue Token")).toHaveLength(0);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "end");
    game.advanceUntil(quiet);
    expect(tokenCopies(game, "Clue Token")).toHaveLength(1);
    expect(game.state.objects[tokenCopies(game, "Clue Token")[0]].controller).toBe(A);
  });
});
