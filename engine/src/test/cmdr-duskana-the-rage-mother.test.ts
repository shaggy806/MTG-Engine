/**
 * Duskana, the Rage Mother — {2}{R}{G}{W} 5/5 legendary Bear:
 *   When Duskana enters, draw a card for each creature you control with base
 *   power and toughness 2/2.
 *   Whenever a creature you control with base power and toughness 2/2
 *   attacks, it gets +3/+3 until end of turn.
 *
 * "Base power and toughness 2/2" is the `basePower` / `baseToughness` filter
 * clauses (rule 613.4b); their rules are pinned in
 * `card-property-clauses.test.ts`.
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
const DUSKANA = "Duskana, the Rage Mother";
const registry = createDefaultRegistry();

function makeGame() {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, a };
}

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Duskana entering for real, its enters trigger resolved; how many cards
 * that drew. */
const enter = (game: Game): number => {
  const before = game.handOf(A).length;
  game.debugSpawn(DUSKANA, A, "battlefield", { announceEntry: true });
  game.advanceUntil(settled);
  return game.handOf(A).length - before;
};

describe("Duskana, the Rage Mother", () => {
  it("is a {2}{R}{G}{W} 5/5 legendary Bear", () => {
    const def = registry.get(DUSKANA);
    expect(def.manaCost).toBe("{2}{R}{G}{W}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Bear"]);
    expect([def.power, def.toughness]).toEqual([5, 5]);
    expect(identityString(colorIdentityOf(def))).toBe("WRG");
  });

  it("draws for each creature you control with base 2/2 — counters and pumps don't change it", () => {
    const { game } = makeGame();
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    const countered = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
      { kind: "object", object: countered },
    ]);
    // A 1/1 pumped to 2/2 isn't base 2/2, a 6/6 isn't, an opponent's 2/2
    // isn't yours.
    const elves = spawn(game, "Llanowar Elves");
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      [{ kind: "object", object: elves }],
    );
    spawn(game, "Wurmcoil Engine");
    spawn(game, "Grizzly Bears", B);
    expect(enter(game)).toBe(3);
  });

  it("counts every token in a stack of 2/2s", () => {
    const { game } = makeGame();
    game.debugApplyEffect(A, { kind: "create-token", token: "Cat Token", count: 10 });
    expect(enter(game)).toBe(10);
  });

  it("gives an attacking base-2/2 creature +3/+3, and nothing else that attacks", () => {
    const { game, a } = makeGame();
    spawn(game, DUSKANA);
    const bears = spawn(game, "Grizzly Bears");
    const countered = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
      { kind: "object", object: countered },
    ]);
    const elves = spawn(game, "Llanowar Elves");
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: countered, defender: B },
      { attacker: elves, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(pt(game, bears)).toEqual([5, 5]);
    expect(pt(game, countered)).toEqual([6, 6]);
    expect(pt(game, elves)).toEqual([1, 1]);
    // Until end of turn.
    game.advanceUntil((s) => s.turn.number === 2);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});
