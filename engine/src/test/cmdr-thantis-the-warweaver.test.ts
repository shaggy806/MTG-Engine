/**
 * Thantis, the Warweaver — {3}{B}{R}{G} 5/5 legendary Spider:
 *   Reach, vigilance
 *   All creatures attack each combat if able.
 *   Whenever a creature attacks you or a planeswalker you control, put a +1/+1
 *   counter on Thantis.
 *
 * "All creatures" means everyone's, Thantis included, and an animated land is
 * one too (the engine fix this card waited on). The counter trigger is about
 * attacks aimed at Thantis's controller: at a three-player table an attack on
 * someone else grows nothing, and Thantis's own attack grows nothing.
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
const C = asPlayerId("carol");
const THANTIS = "Thantis, the Warweaver";
const registry = createDefaultRegistry();

const mkGame = (players: readonly PlayerId[] = [A, B]) => {
  const controllers: Record<PlayerId, ScriptedController> = {};
  for (const p of players) controllers[p] = new ScriptedController(p);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });
  return { game, controllers };
};

const attackersDeclared = (game: Game): ObjectId[] =>
  game.state.eventLog.flatMap((e) => (e.type === "attacker-declared" ? [e.attacker] : []));
const counters = (game: Game, id: ObjectId): number =>
  game.state.objects[id].counters["+1/+1"] ?? 0;
const at =
  (turn: number, step: string) =>
  (s: GameState): boolean =>
    s.turn.number === turn && s.turn.step === step;

describe("Thantis, the Warweaver", () => {
  it("forces every creature into combat, its own controller's and Thantis too", () => {
    const { game } = mkGame();
    game.advanceUntil(at(1, "precombat-main"));
    const thantis = game.debugSpawn(THANTIS, A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });

    // Alice's controller declares nothing; the requirement fills it in.
    game.advanceUntil(at(1, "postcombat-main"));
    const attacked = attackersDeclared(game);
    expect(attacked).toContain(thantis);
    expect(attacked).toContain(bears);
    // Vigilance: attacking didn't tap Thantis.
    expect(game.state.objects[thantis].tapped).toBe(false);
    // Thantis attacking Bob is not an attack on Alice.
    expect(counters(game, thantis)).toBe(0);
  });

  it("forces an opponent's creatures to attack, and grows for each one", () => {
    const { game } = mkGame();
    game.advanceUntil(at(1, "precombat-main"));
    const thantis = game.debugSpawn(THANTIS, A, "battlefield");
    const theirs = [0, 1].map(() =>
      game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false }),
    );

    game.advanceUntil(at(2, "postcombat-main"));
    for (const id of theirs) expect(attackersDeclared(game)).toContain(id);
    expect(counters(game, thantis)).toBe(2);
    expect(computeCharacteristics(game.state, registry, thantis).power).toBe(7);
  });

  it("an animated land is a creature, so it has to attack too", () => {
    const { game } = mkGame();
    game.advanceUntil(at(1, "precombat-main"));
    game.debugSpawn(THANTIS, A, "battlefield");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const factory = game.debugSpawn("Mishra's Factory", A, "battlefield", { summoningSick: false });
    game.dispatch({ type: "activate-ability", player: A, source: factory, abilityIndex: 1 });
    game.advanceUntil(at(1, "postcombat-main"));
    expect(attackersDeclared(game)).toContain(factory);
  });

  it("counts only attacks on its own controller at a three-player table", () => {
    const { game, controllers } = mkGame([A, B, C]);
    game.advanceUntil(at(1, "precombat-main"));
    const thantis = game.debugSpawn(THANTIS, B, "battlefield");
    const one = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const two = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    // Alice sends one at Carol and one at Bob.
    controllers[A].declareAttackersFn = () => [
      { attacker: one, defender: C },
      { attacker: two, defender: B },
    ];
    game.advanceUntil(at(1, "postcombat-main"));
    expect(counters(game, thantis)).toBe(1);
  });
});
