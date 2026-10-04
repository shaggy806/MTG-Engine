/**
 * Top-10000 batch 35g. Pins the clauses most likely to be wired wrong:
 * Scute Mob's intervening "if", Regal Bunnicorn's nonland count, Assassin
 * Initiate's resolution-time choice, Oakhame Adversary's opponent-colour
 * cost reduction, and Goblin Grenade's Goblin sacrifice.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (hand: readonly string[] = []): Game => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const counters = (game: Game, id: ObjectId): number => game.state.objects[id].counters?.["+1/+1"] ?? 0;

describe("top-10000 batch 35g — Scute Mob", () => {
  const run = (landCount: number): number => {
    const game = setUp();
    const mob = spawn(game, "Scute Mob");
    for (let i = 0; i < landCount; i += 1) spawn(game, "Forest");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    game.advanceUntil(quiet);
    return counters(game, mob);
  };
  it("gets four counters at your upkeep with five lands", () => {
    expect(run(5)).toBe(4);
  });
  it("gets none with four lands", () => {
    expect(run(4)).toBe(0);
  });
});

describe("top-10000 batch 35g — Regal Bunnicorn", () => {
  it("counts nonland permanents you control, itself included, and not lands or opponents'", () => {
    const game = setUp();
    const bun = spawn(game, "Regal Bunnicorn");
    spawn(game, "Forest");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears", B);
    const c = game.characteristics(bun);
    expect(c.power).toBe(2);
    expect(c.toughness).toBe(2);
  });
});

describe("top-10000 batch 35g — Assassin Initiate", () => {
  it("grants the keyword chosen on resolution, until end of turn", () => {
    const game = setUp();
    const assassin = spawn(game, "Assassin Initiate");
    spawn(game, "Wastes");
    game.dispatch({ type: "activate-ability", player: A, source: assassin, abilityIndex: 0 });
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    game.advanceUntil(quiet);
    const k = game.characteristics(assassin).keywords;
    expect(k.has("deathtouch")).toBe(true);
    expect(k.has("flying")).toBe(false);
    expect(k.has("lifelink")).toBe(false);
  });
});

describe("top-10000 batch 35g — Oakhame Adversary", () => {
  const castable = (opponentGreen: boolean): boolean => {
    const game = setUp(["Oakhame Adversary"]);
    spawn(game, "Forest");
    spawn(game, "Forest");
    if (opponentGreen) spawn(game, "Grizzly Bears", B);
    else spawn(game, "Wastes", B);
    const card = inHand(game, "Oakhame Adversary");
    return game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);
  };
  it("costs {2} less while an opponent controls a green permanent", () => {
    expect(castable(true)).toBe(true);
  });
  it("costs full price otherwise", () => {
    expect(castable(false)).toBe(false);
  });
});

describe("top-10000 batch 35g — Goblin Grenade", () => {
  it("needs a Goblin to sacrifice", () => {
    const game = setUp(["Goblin Grenade"]);
    spawn(game, "Mountain");
    spawn(game, "Grizzly Bears");
    const card = inHand(game, "Goblin Grenade");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card)).toBe(false);
  });
});
