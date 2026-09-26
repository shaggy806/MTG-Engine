/**
 * Pako, Arcane Retriever — {3}{R}{G} legendary 3/3 Elemental Dog.
 *
 *   Partner with Haldan, Avid Arcanist
 *   Haste
 *   Whenever Pako attacks, exile the top card of each player's library and
 *   put a fetch counter on each of them. Put a +1/+1 counter on Pako for each
 *   noncreature card exiled this way.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const setUp = (tops: Record<string, string>) => {
  const players = Object.keys(tops) as PlayerId[];
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const top: Record<string, ObjectId> = {};
  for (const player of players) top[player] = game.debugSpawn(tops[player], player, "library");
  // Cast, so haste is what lets it attack.
  const pako = game.debugSpawn("Pako, Arcane Retriever", A, "battlefield");
  const a = controllers[A] as ScriptedController;
  a.declareAttackersFn = () => [{ attacker: pako, defender: B }];
  return { game, pako, top };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const attack = (game: Game): void =>
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "declare-blockers" && quiet(s));

describe("Pako, Arcane Retriever", () => {
  it("exiles the top card of each library with a fetch counter, and grows for each noncreature one", () => {
    const { game, pako, top } = setUp({ [A]: "Opt", [B]: "Forest", [C]: "Grizzly Bears" });
    expect(game.state.objects[pako].summoningSick).toBe(true);
    attack(game);
    for (const player of [A, B, C]) {
      expect(game.state.objects[top[player]].zone).toBe("exile");
      expect(game.state.objects[top[player]].counters).toEqual({ fetch: 1 });
      // No permission to play them.
      expect(game.state.objects[top[player]].impulse).toBeUndefined();
    }
    // Opt and Forest are noncreature cards; Grizzly Bears isn't.
    expect(game.state.objects[pako].counters).toEqual({ "+1/+1": 2 });
  });

  it("no noncreature card, no counters", () => {
    const { game, pako } = setUp({ [A]: "Grizzly Bears", [B]: "Grizzly Bears" });
    attack(game);
    expect(game.state.objects[pako].counters).toEqual({});
  });
});
