/**
 * Sonic the Hedgehog: "whenever Sonic attacks, put a +1/+1 counter on each
 * creature you control with flash or haste" (itself included — it has
 * haste), and the Treasure trigger, a `dealt-damage` with a filter — covered
 * in depth in `damage-trigger-extensions.test.ts`.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const plusOnes = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;
const afterCombat = (s: GameState): boolean =>
  s.turn.step === "postcombat-main" && s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0;

describe("Sonic the Hedgehog", () => {
  it("Gotta Go Fast: a counter on each creature you control with flash or haste", () => {
    const { game, a } = setUp();
    const sonic = spawn(game, "Sonic the Hedgehog");
    const goblin = spawn(game, "Raging Goblin");
    const bears = spawn(game, "Grizzly Bears");
    const hasty = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(
      A,
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      [{ kind: "object", object: hasty }],
    );
    const theirs = spawn(game, "Raging Goblin", B);
    a.declareAttackersFn = () => [{ attacker: sonic, defender: B }];
    game.advanceUntil(afterCombat);
    expect([sonic, goblin, bears, hasty, theirs].map((id) => plusOnes(game, id))).toEqual([1, 1, 0, 1, 0]);
    // Sonic attacked as a 3/4 with its counter.
    expect(game.state.players[B].life).toBe(17);
  });

  it("blocked and dealt combat damage, it makes a tapped Treasure", () => {
    const { game, a, b } = setUp();
    const sonic = spawn(game, "Sonic the Hedgehog");
    const blocker = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: sonic, defender: B }];
    b.declareBlockersFn = () => [{ blocker, attacker: sonic }];
    game.advanceUntil(afterCombat);
    const treasures = game.battlefield.filter((id) => game.state.objects[id].cardName === "Treasure Token");
    expect(treasures).toHaveLength(1);
    expect(game.state.objects[treasures[0]].controller).toBe(A);
    expect(game.state.objects[treasures[0]].tapped).toBe(true);
  });
});
