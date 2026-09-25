/**
 * Keyword counters (rule 122.1b): a permanent with a flying, lifelink,
 * vigilance… counter on it has that keyword while the counter is there — in
 * layer 6, where a static that cares about keywords ("creatures you control
 * with flying get +1/+1") sees it too. Sorin, Ravenous Neonate's "put a
 * lifelink counter on it".
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "Creatures you control with flying get +1/+1." */
const SKY_ANTHEM = "Test Sky Anthem";
const registry = createDefaultRegistry().register(
  defineCard({
    name: SKY_ANTHEM,
    manaCost: "{0}",
    types: ["enchantment"],
    text: "Creatures you control with flying get +1/+1.",
    static: [
      {
        affects: { scope: "creatures-you-control", withKeyword: "flying" },
        grantPt: [1, 1],
        text: "Creatures you control with flying get +1/+1.",
      },
    ],
  }),
);

const setUp = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, controllers };
};
const counter = (game: Game, id: ObjectId, kind: string, amount = 1): void => {
  game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: kind, amount }, [
    { kind: "object", object: id },
  ]);
};
const keywords = (game: Game, id: ObjectId): readonly string[] => [...game.characteristics(id).keywords];

describe("keyword counters", () => {
  it("a flying counter gives flying, and a static that cares sees it", () => {
    const { game } = setUp();
    game.debugSpawn(SKY_ANTHEM, A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(keywords(game, bears)).not.toContain("flying");
    expect(game.characteristics(bears).power).toBe(2);
    counter(game, bears, "flying");
    expect(keywords(game, bears)).toContain("flying");
    expect(game.characteristics(bears).power).toBe(3);
  });

  it("…for as long as the counter is there", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    counter(game, bears, "flying");
    game.state.objects[bears].counters.flying = 0;
    expect(keywords(game, bears)).not.toContain("flying");
  });

  it("a lifelink counter: the damage it deals gains its controller life", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    counter(game, bears, "lifelink");
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 2 }, [{ kind: "player", player: B }], {
      source: bears,
    });
    expect(game.state.players[B].life).toBe(18);
    expect(game.state.players[A].life).toBe(22);
  });

  it("a vigilance counter: it attacks without tapping", () => {
    const { game, controllers } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    counter(game, bears, "vigilance");
    controllers[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s: GameState) => s.turn.step === "declare-blockers" || s.turn.step === "combat-damage");
    expect(game.state.objects[bears].attacking).toBe(B);
    expect(game.state.objects[bears].tapped).toBe(false);
  });

  it("an ordinary counter named for nothing grants nothing", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    counter(game, bears, "charge");
    expect(keywords(game, bears)).toEqual([]);
  });
});
