/**
 * Two commanders the gap triage said needed no engine work, checked clause
 * by clause.
 *
 * Magnus the Red: instants and sorceries *you* cast cost {1} less for each
 * creature *token* you control (a nontoken creature doesn't count, a
 * creature spell isn't discounted, and an opponent's spells aren't), and a
 * 3/3 Spawn when it deals combat damage to a player.
 *
 * Dr. Madison Li: {E} for each artifact spell you cast (not a nonartifact
 * one), and three energy-costed {T} abilities that aren't offered without
 * the energy.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...aHand, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const canCast = (game: Game, player: PlayerId, name: string): boolean =>
  game
    .legalActions(player)
    .some((o) => o.kind === "cast-spell" && game.state.objects[o.card]?.cardName === name && !("via" in o && o.via !== undefined));
const tokens = (game: Game, player: PlayerId, n: number): void =>
  game.debugApplyEffect(player, { kind: "create-token", token: "Spawn Token", count: n });

describe("Magnus the Red", () => {
  it("each creature token you control takes {1} off your instants and sorceries", () => {
    const { game } = setUp(["Behold the Multiverse"]);
    game.debugSpawn("Magnus the Red", A, "battlefield");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", A, "battlefield");

    // {3}{U} with two Islands: not yet.
    expect(canCast(game, A, "Behold the Multiverse")).toBe(false);
    // A nontoken creature is no help.
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(canCast(game, A, "Behold the Multiverse")).toBe(false);
    // One token: {2}{U}, still short. Two: {1}{U}, castable.
    tokens(game, A, 1);
    expect(canCast(game, A, "Behold the Multiverse")).toBe(false);
    tokens(game, A, 1);
    expect(canCast(game, A, "Behold the Multiverse")).toBe(true);
  });

  it("doesn't discount a creature spell, or an opponent's spells for your tokens", () => {
    const { game } = setUp(["Behold the Multiverse", "Grizzly Bears"]);
    game.debugSpawn("Magnus the Red", A, "battlefield");
    tokens(game, A, 3);
    game.debugSpawn("Forest", A, "battlefield");
    // Bears ({1}{G}) with one Forest: a discount would make it castable.
    expect(canCast(game, A, "Grizzly Bears")).toBe(false);

    // Bob, with Alice's tokens on the table, pays full price.
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", B, "battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(canCast(game, B, "Behold the Multiverse")).toBe(false);
  });

  it("makes a 3/3 red Spawn when it deals combat damage to a player", () => {
    const { game, a } = setUp([]);
    const magnus = game.debugSpawn("Magnus the Red", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: magnus, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    const spawn = game.battlefield.filter((id) => game.state.objects[id].cardName === "Spawn Token");
    expect(spawn).toHaveLength(1);
    const c = game.characteristics(spawn[0]);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect([...c.colors]).toEqual(["R"]);
    expect(game.state.objects[spawn[0]].isToken).toBe(true);
  });
});

describe("Dr. Madison Li", () => {
  const energy = (game: Game): number => game.state.players[A].energy;
  const offersAbility = (game: Game, source: ObjectId, index: number): boolean =>
    game
      .legalActions(A)
      .some((o) => o.kind === "activate-ability" && o.source === source && o.abilityIndex === index);

  it("gets {E} for an artifact spell, not for another spell", () => {
    const { game } = setUp(["Sol Ring", "Grizzly Bears"]);
    game.debugSpawn("Dr. Madison Li", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Sol Ring") });
    game.advanceUntil(quiet);
    expect(energy(game)).toBe(1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Grizzly Bears") });
    game.advanceUntil(quiet);
    expect(energy(game)).toBe(1);
  });

  it("offers each ability only with the energy for it, and pays it", () => {
    const { game } = setUp([]);
    const li = game.debugSpawn("Dr. Madison Li", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(offersAbility(game, li, 0)).toBe(false);

    game.debugApplyEffect(A, { kind: "get-energy", amount: 1 });
    expect(offersAbility(game, li, 0)).toBe(true);
    expect(offersAbility(game, li, 1)).toBe(false);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: li,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    expect(energy(game)).toBe(0);
    const c = game.characteristics(bears);
    expect([c.power, c.toughness]).toEqual([3, 2]);
    expect(c.keywords.has("trample")).toBe(true);
    expect(c.keywords.has("haste")).toBe(true);
    expect(game.state.objects[li].tapped).toBe(true);
  });

  it("draws for three, and returns an artifact card tapped for five", () => {
    const { game } = setUp([]);
    const li = game.debugSpawn("Dr. Madison Li", A, "battlefield", { summoningSick: false });
    game.debugApplyEffect(A, { kind: "get-energy", amount: 3 });
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: li, abilityIndex: 1 });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(energy(game)).toBe(0);

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "get-energy", amount: 5 });
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: li,
      abilityIndex: 2,
      targets: [{ kind: "object", object: ring }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("battlefield");
    expect(game.state.objects[ring].tapped).toBe(true);
    expect(energy(game)).toBe(0);
  });
});
