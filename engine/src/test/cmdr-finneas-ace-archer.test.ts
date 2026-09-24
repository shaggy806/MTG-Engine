/**
 * Finneas, Ace Archer — {G}{W} 2/2 legendary Rabbit Archer:
 *   Vigilance, reach
 *   Whenever Finneas attacks, put a +1/+1 counter on each other creature you
 *   control that's a token or a Rabbit. Then if creatures you control have
 *   total power 10 or greater, draw a card.
 *
 * The draw is checked as the ability resolves, after the counters, and
 * Finneas's own power is part of the total. A token stack is every token in
 * it: each member gets a counter and each member's power counts.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const FINNEAS = "Finneas, Ace Archer";
const registry = createDefaultRegistry();

const makeGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
};

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const token = (game: Game, player: PlayerId, count = 1): ObjectId => {
  game.debugApplyEffect(player, { kind: "create-token", token: "Saproling Token", count });
  const made = game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === "Saproling Token" &&
      game.state.objects[id].controller === player,
  );
  return made[made.length - 1];
};
const plusOnes = (game: Game, id: ObjectId): number =>
  game.state.objects[id].counters["+1/+1"] ?? 0;
const toPostcombat = (s: GameState): boolean => s.turn.step === "postcombat-main";

const attackWithFinneas = (game: Game, a: ScriptedController, finneas: ObjectId): number => {
  const hand = game.handOf(A).length;
  a.declareAttackersFn = () => [{ attacker: finneas, defender: B }];
  game.advanceUntil(toPostcombat);
  return game.handOf(A).length - hand;
};

describe("Finneas, Ace Archer", () => {
  it("is a {G}{W} 2/2 legendary Rabbit Archer with vigilance and reach", () => {
    const def = registry.get(FINNEAS);
    expect(def.manaCost).toBe("{G}{W}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Rabbit", "Archer"]);
    expect([def.power, def.toughness]).toEqual([2, 2]);
    expect(def.keywords).toEqual(["vigilance", "reach"]);
    expect(identityString(colorIdentityOf(def))).toBe("WG");
  });

  it("counters each other token or Rabbit you control — not itself, a nontoken non-Rabbit, or an opponent's", () => {
    const { game, a } = makeGame();
    const finneas = spawn(game, FINNEAS, A);
    const sap = token(game, A);
    const rabbit = spawn(game, "Ms. Bumbleflower", A);
    const bears = spawn(game, "Grizzly Bears", A);
    const theirs = token(game, B);

    // 2 + 2 + 2 + 2 = 8 total power afterwards: no card.
    expect(attackWithFinneas(game, a, finneas)).toBe(0);
    expect(plusOnes(game, sap)).toBe(1);
    expect(plusOnes(game, rabbit)).toBe(1);
    expect(plusOnes(game, bears)).toBe(0);
    expect(plusOnes(game, finneas)).toBe(0);
    expect(plusOnes(game, theirs)).toBe(0);
    // Vigilance: attacking didn't tap it.
    expect(game.state.objects[finneas].tapped).toBe(false);
  });

  it("draws once creatures you control total 10 power — counted after the counters, Finneas included", () => {
    const { game, a } = makeGame();
    const finneas = spawn(game, FINNEAS, A);
    for (let i = 0; i < 3; i += 1) spawn(game, "Grizzly Bears", A);
    token(game, A);
    // Before the counters: 2 + 6 + 1 = 9. After: 10, of which 2 are Finneas's.
    expect(attackWithFinneas(game, a, finneas)).toBe(1);
  });

  it("an opponent's creatures don't count toward the total", () => {
    const { game, a } = makeGame();
    const finneas = spawn(game, FINNEAS, A);
    for (let i = 0; i < 4; i += 1) spawn(game, "Grizzly Bears", B);
    expect(attackWithFinneas(game, a, finneas)).toBe(0);
  });

  it("grows every token in a stack, and counts each one's power", () => {
    const { game, a } = makeGame();
    const finneas = spawn(game, FINNEAS, A);
    const stack = token(game, A, 8);
    expect(game.state.objects[stack].stackCount).toBe(8);
    // 2 + 8 × 2 = 18; counting the stack once would be 4.
    expect(attackWithFinneas(game, a, finneas)).toBe(1);
    const saps = game.state.zones.shared.battlefield
      .map((id) => game.state.objects[id])
      .filter((o) => o.cardName === "Saproling Token");
    expect(saps.reduce((n, o) => n + (o.stackCount ?? 1), 0)).toBe(8);
    for (const o of saps) expect(o.counters["+1/+1"]).toBe(1);
  });
});
