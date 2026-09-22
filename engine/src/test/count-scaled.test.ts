import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Forest")] },
      { player: B, cards: Array(40).fill("Forest") },
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
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

describe("Scourge of Valkas — damage = number of Dragons you control", () => {
  it("deals damage equal to the Dragon count (itself included) on its own ETB", () => {
    const { game, a } = mkGame(["Scourge of Valkas"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    game.debugSpawn("Dragon Token", A, "battlefield");
    game.debugSpawn("Dragon Token", A, "battlefield");
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    const bLife = game.state.players[B].life;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Scourge of Valkas"),
    });
    game.advanceUntil(quiet);

    // 2 tokens + Scourge itself = 3 Dragons.
    expect(game.state.players[B].life).toBe(bLife - 3);
  });
});

describe("Craterhoof Behemoth — +X/+X where X = creatures you control", () => {
  it("pumps every creature you control by the creature count and grants trample", () => {
    const { game } = mkGame(["Craterhoof Behemoth"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 8; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const bears = [
      game.debugSpawn("Grizzly Bears", A, "battlefield"),
      game.debugSpawn("Grizzly Bears", A, "battlefield"),
      game.debugSpawn("Grizzly Bears", A, "battlefield"),
    ];

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Craterhoof Behemoth"),
    });
    game.advanceUntil(quiet);

    // 3 Bears + Craterhoof = 4 creatures -> +4/+4.
    const bear0 = game.characteristics(bears[0]);
    expect(bear0.power).toBe(2 + 4);
    expect(bear0.toughness).toBe(2 + 4);
    expect(bear0.keywords.has("trample")).toBe(true);
    const hoof = game.characteristics(named(game, game.battlefield, "Craterhoof Behemoth"));
    expect(hoof.power).toBe(5 + 4);
    expect(hoof.keywords.has("trample")).toBe(true);
  });
});

describe("Krenko, Mob Boss — tokens = number of Goblins you control", () => {
  const goblins = (game: Game): number =>
    game.battlefield.filter(
      (id) =>
        game.state.objects[id].controller === A &&
        game.characteristics(id).subtypes.includes("Goblin"),
    ).length;

  it("doubles the Goblin count on each activation", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const krenko = game.debugSpawn("Krenko, Mob Boss", A, "battlefield");
    game.state.objects[krenko].summoningSick = false;

    // Krenko counts himself, so the first tap makes exactly one token.
    expect(goblins(game)).toBe(1);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: krenko,
      abilityIndex: 0,
      targets: [],
    });
    game.advanceUntil(quiet);
    expect(goblins(game)).toBe(2);

    // The tokens count too, which is the card: each activation doubles.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: krenko,
      abilityIndex: 0,
      targets: [],
    });
    game.advanceUntil(quiet);
    expect(goblins(game)).toBe(4);
  });

  it("counts only Goblins its controller has", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const krenko = game.debugSpawn("Krenko, Mob Boss", A, "battlefield");
    game.state.objects[krenko].summoningSick = false;
    // An opponent's Goblin must not inflate the count.
    game.debugSpawn("Raging Goblin", B, "battlefield");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: krenko,
      abilityIndex: 0,
      targets: [],
    });
    game.advanceUntil(quiet);
    expect(goblins(game)).toBe(2);
  });
});
