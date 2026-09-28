/**
 * Helping an opponent's creature (the user's rule, 2026-09-27): only while it
 * attacks someone else, and then with help that ends at end of turn, on a
 * creature goaded by us, or — for anything lasting — when it kills the
 * player being attacked. Never on a creature at home, never on one attacking
 * us. Battlegrowth's +1/+1 counter is the lasting kind.
 */

import { describe, expect, it } from "vitest";

import type { Action } from "../actions.js";
import { EvalBotController } from "../bot/eval-bot.js";
import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const [A, B, C, D] = ["alice", "bob", "carol", "dave"].map(asPlayerId);
const registry = createDefaultRegistry();

/** Carol's Grizzly Bears attacking `defender`, who is at `life`; alice holds
 * Battlegrowth with a Forest to cast it, and has priority. */
function attack(defender: PlayerId, life: number): { game: Game; bears: ObjectId } {
  const game = Game.create({
    seed: 3,
    shuffle: false,
    registry,
    startingPlayer: C,
    decks: [A, B, C, D].map((player) => ({ player, cards: Array(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === C);
  for (const player of [A, B, C, D]) game.state.zones.perPlayer[player].hand = [];
  game.debugSpawn("Forest", A, "battlefield");
  game.debugSpawn("Battlegrowth", A, "hand");
  const bears = game.debugSpawn("Grizzly Bears", C, "battlefield", { summoningSick: false });
  game.state.players[defender].life = life;
  game.advanceUntil((s) => s.awaiting?.kind === "attackers");
  game.dispatch({ type: "declare-attackers", player: C, attackers: [{ attacker: bears, defender }] });
  game.advanceUntil((s) => s.priority.holder === A);
  return { game, bears };
}

/** What alice does, and every candidate the search simulated. */
function decide(game: Game): { action: Action; tried: Action[] } {
  const tried: Action[] = [];
  const bot = new EvalBotController(A, registry, {
    trace: (candidate: Action, _after: GameState | null) => tried.push(candidate),
  });
  const action = bot.act({ state: game.state, player: A, legalActions: () => game.legalActions(A) });
  return { action, tried };
}

const pumpsBears = (bears: ObjectId) => (a: Action) =>
  a.type === "cast-spell" && a.targets?.some((t) => t?.kind === "object" && t.object === bears);

describe("helping an opponent's attacker", () => {
  it("never helps a creature attacking us", () => {
    const { game, bears } = attack(A, 20);
    const { action, tried } = decide(game);
    expect(tried.some(pumpsBears(bears))).toBe(false);
    expect(pumpsBears(bears)(action)).toBe(false);
  });

  it("gives a lasting counter to someone else's attacker only if it kills", () => {
    // Dave at 20: the counter would only make carol's Bears bigger for good.
    const safe = attack(D, 20);
    expect(pumpsBears(safe.bears)(decide(safe.game).action)).toBe(false);
    // Dave at 3: two damage plus the counter's one knocks him out, so the
    // move is weighed like any other.
    const lethal = attack(D, 3);
    expect(decide(lethal.game).tried.some(pumpsBears(lethal.bears))).toBe(true);
  });
});
