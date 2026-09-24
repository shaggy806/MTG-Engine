/**
 * Ghyrson Starn, Kelermorph: ward {2}, and "whenever another source you
 * control deals exactly 1 damage to a permanent or player, Ghyrson Starn
 * deals 2 damage to that permanent or player". The trigger's rules are in
 * `damage-trigger-extensions.test.ts`; this plays the classic combo: a
 * painland's 1 to its own controller, and a Pyroclasm-style 1 to a creature.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const GHYRSON = "Ghyrson Starn, Kelermorph";

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
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("Ghyrson Starn, Kelermorph", () => {
  it("a painland's 1 damage to you is exactly 1: Ghyrson deals you 2 more", () => {
    const { game } = setUp();
    game.debugSpawn(GHYRSON, A);
    const forest = game.debugSpawn("Karplusan Forest", A);
    game.debugApplyEffect(A, { kind: "damage", amount: 1, target: 0 }, [{ kind: "player", player: A }], {
      source: forest,
    });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(17);
  });

  it("an opponent's 2-toughness creature dealt 1 is dealt 2 more and dies", () => {
    const { game } = setUp();
    game.debugSpawn(GHYRSON, A);
    const forest = game.debugSpawn("Karplusan Forest", A);
    const bears = game.debugSpawn("Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "damage", amount: 1, target: 0 }, [{ kind: "object", object: bears }], {
      source: forest,
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("has ward {2}", () => {
    const { game } = setUp();
    const ghyrson = game.debugSpawn(GHYRSON, A);
    const statics = game.registry.get(game.state.objects[ghyrson].cardName).static;
    expect(statics.some((s) => s.ward?.mana === "{2}")).toBe(true);
  });
});
