/**
 * Cards dropped for want of the player ordering their own simultaneous
 * triggers (rule 603.3b), authored once the opt-in `order-triggers` decision
 * landed: Tifa Lockhart, Hero of Bladehold, and Yarok, the Desecrated (whose
 * doubled triggers are one ability twice, so not asked among themselves).
 */

import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const ready = (game: Game, name: string): ObjectId =>
  game.debugSpawn(name, A, "battlefield", { summoningSick: false });
const enters = (game: Game, name: string, player = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const power = (game: Game, id: ObjectId): number =>
  computeCharacteristics(game.state, game.registry, id).power;

describe("Tifa Lockhart", () => {
  it("doubles its power for each land, until end of turn", () => {
    const game = setUp();
    const tifa = ready(game, "Tifa Lockhart");
    enters(game, "Forest");
    game.advanceUntil(quiet);
    expect(power(game, tifa)).toBe(2);
    enters(game, "Forest");
    game.advanceUntil(quiet);
    expect(power(game, tifa)).toBe(4);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(power(game, tifa)).toBe(1);
  });

  // Canyon Jerboa's landfall gives +1/+1: pumped first and then doubled,
  // Tifa's power is (1 + 1) × 2 = 4; doubled first, 2 + 1 = 3.
  for (const [first, expected] of [["Canyon Jerboa", 4], ["Tifa Lockhart", 3]] as const) {
    it(`resolving ${first}'s landfall first, when its controller orders it, makes ${expected}`, () => {
      const game = setUp();
      const tifa = ready(game, "Tifa Lockhart");
      ready(game, "Canyon Jerboa");
      game.setOrdersOwnTriggers(A, true);
      enters(game, "Forest");
      game.advanceUntil((s) => s.awaiting !== null);
      const awaiting = game.state.awaiting;
      if (awaiting?.kind !== "order-triggers") throw new Error("not asked to order");
      const top = awaiting.triggers.findIndex((t) => t.cardName === first);
      game.dispatch({ type: "order-triggers", player: A, order: [top, 1 - top] });
      game.advanceUntil(quiet);
      expect(power(game, tifa)).toBe(expected);
    });
  }
});

describe("Hero of Bladehold", () => {
  const attack = (orders: boolean) => {
    const game = setUp();
    const hero = ready(game, "Hero of Bladehold");
    const bears = ready(game, "Grizzly Bears");
    game.setOrdersOwnTriggers(A, orders);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: hero, defender: B },
        { attacker: bears, defender: B },
      ],
    });
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    return { game, hero, bears };
  };
  const soldiers = (game: Game): ObjectId[] =>
    game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Soldier Token");

  it("makes two Soldiers attacking, and pumps the other attackers", () => {
    const { game, hero, bears } = attack(false);
    game.advanceUntil(quiet);
    const tokens = soldiers(game);
    expect(tokens).toHaveLength(2);
    expect(tokens.every((id) => game.state.objects[id].attacking === B && game.state.objects[id].tapped)).toBe(true);
    expect(power(game, bears)).toBe(3);
    expect(power(game, hero)).toBe(3);
  });

  it("with the tokens made first, battle cry pumps them too", () => {
    const { game } = attack(true);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "order-triggers") throw new Error("not asked to order");
    const tokensFirst = awaiting.triggers.findIndex((t) => t.text.startsWith("Whenever this creature attacks, create"));
    game.dispatch({ type: "order-triggers", player: A, order: [tokensFirst, 1 - tokensFirst] });
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    // Each token attacks a defender of its controller's choosing; with one
    // opponent there's nothing to ask, but answer if asked.
    while (game.state.awaiting?.kind === "enter-attacking") {
      const ask = game.state.awaiting;
      game.dispatch({
        type: "enter-attacking",
        player: A,
        assignments: ask.creatures.map((c) => ({ object: c.object, target: B })),
      });
      game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    }
    game.advanceUntil(quiet);
    expect(soldiers(game).map((id) => power(game, id))).toEqual([2, 2]);
  });
});

describe("Yarok, the Desecrated", () => {
  it("makes its controller's enters triggers trigger twice, its own entry included", () => {
    const game = setUp();
    ready(game, "Soul Warden");
    const theirs = game.debugSpawn("Soul Warden", B, "battlefield");
    const life = { a: game.state.players[A].life, b: game.state.players[B].life };
    enters(game, "Yarok, the Desecrated");
    game.advanceUntil(quiet);
    // Alice's Soul Warden twice; Bob's once — Yarok doubles only its
    // controller's abilities.
    expect(game.state.players[A].life).toBe(life.a + 2);
    expect(game.state.players[B].life).toBe(life.b + 1);
    expect(theirs).toBeDefined();
  });

  it("doubles a trigger caused by an opponent's permanent entering", () => {
    const game = setUp();
    ready(game, "Yarok, the Desecrated");
    ready(game, "Soul Warden");
    const life = game.state.players[A].life;
    enters(game, "Grizzly Bears", B);
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(life + 2);
  });
});
