/**
 * Sokka, Tenacious Tactician — {1}{U}{R}{W} 3/3 legendary Human Warrior Ally:
 *   Menace, prowess
 *   Other Allies you control have menace and prowess.
 *   Whenever you cast a noncreature spell, create a 1/1 white Ally creature
 *   token.
 *
 * The negatives: a non-Ally gets neither keyword, an opponent's Ally gets
 * neither, a creature spell makes no token, and the token a spell just made
 * missed that spell's prowess (it wasn't there when the spell was cast).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const SOKKA = "Sokka, Tenacious Tactician";
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
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Forest")] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const sokka = game.debugSpawn(SOKKA, A, "battlefield", { summoningSick: false });
  for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", A, "battlefield");
  return { game, a, b, sokka };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const cast = (game: Game, name: string): void => {
  game.dispatch({ type: "cast-spell", player: A, card: inHand(game, name) });
  game.advanceUntil(quiet);
};
const alliesOf = (game: Game, player: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === "Ally Token" &&
      game.state.objects[id].controller === player,
  );

describe("Sokka, Tenacious Tactician", () => {
  it("has menace and prowess, and makes an Ally per noncreature spell", () => {
    const { game, sokka } = setUp(["Sol Ring", "Sol Ring"]);
    expect(chars(game, sokka).keywords).toContain("menace");

    cast(game, "Sol Ring");
    expect(chars(game, sokka).power).toBe(4);
    const [first] = alliesOf(game, A);
    expect(first).toBeDefined();
    const token = chars(game, first);
    expect([token.power, token.toughness]).toEqual([1, 1]);
    expect([...token.colors]).toEqual(["W"]);
    expect(token.subtypes).toContain("Ally");
    expect(game.state.objects[first].isToken).toBe(true);
    expect(token.keywords).toContain("menace");

    // The second spell pumps the first token (an Ally with prowess now) and
    // makes another, which in turn misses that spell.
    cast(game, "Sol Ring");
    const allies = alliesOf(game, A);
    expect(allies).toHaveLength(2);
    expect(chars(game, first).power).toBe(2);
    expect(chars(game, allies[1]).power).toBe(1);
    expect(chars(game, sokka).power).toBe(5);
  });

  it("an Ally you already had gets menace and prowess; a non-Ally gets neither", () => {
    const { game } = setUp(["Sol Ring"]);
    const ally = game.debugSpawn("Bruse Tarl, Boorish Herder", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const before = chars(game, ally).power;

    expect(chars(game, ally).keywords).toContain("menace");
    expect(chars(game, bears).keywords).not.toContain("menace");

    cast(game, "Sol Ring");
    expect(chars(game, ally).power).toBe(before + 1);
    expect(chars(game, bears).power).toBe(2);
  });

  it("an opponent's Ally gets nothing, and a creature spell makes no token", () => {
    const { game } = setUp(["Grizzly Bears"]);
    const theirs = game.debugSpawn("Bruse Tarl, Boorish Herder", B, "battlefield");
    expect(chars(game, theirs).keywords).not.toContain("menace");

    cast(game, "Grizzly Bears");
    expect(alliesOf(game, A)).toHaveLength(0);
  });
});
