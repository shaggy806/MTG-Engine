/**
 * Kediss, Emberclaw Familiar: "whenever a commander you control deals combat
 * damage to an opponent, it deals that much damage to each other opponent" —
 * a `deals-damage` trigger (combat, to an opponent, from a commander) whose
 * damage comes from the commander (`from: "trigger-object"`) and goes to
 * `"each-other-opponent"`. The four-player split is covered in
 * `player-scope-extensions.test.ts`; this is the rest.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { canPairCommanders } from "../deck-validation.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const KEDISS = "Kediss, Emberclaw Familiar";

const setUp = () => {
  const players = [A, B, C];
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a: controllers[A] as ScriptedController };
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const afterCombat = (s: GameState): boolean =>
  s.turn.step === "postcombat-main" && s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0;
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;

describe("Kediss, Emberclaw Familiar", () => {
  it("the commander's own lifelink applies to the damage it deals the other opponents", () => {
    const { game, a } = setUp();
    spawn(game, KEDISS);
    const nighthawk = spawn(game, "Vampire Nighthawk");
    game.state.objects[nighthawk].isCommander = true;
    a.declareAttackersFn = () => [{ attacker: nighthawk, defender: B }];
    game.advanceUntil(afterCombat);
    expect(life(game, B)).toBe(18);
    expect(life(game, C)).toBe(18);
    // 2 from the combat hit, 2 from the damage Kediss had it deal.
    expect(life(game, A)).toBe(24);
    // Deathtouch too: the Nighthawk is the source.
    const toCarol = game.state.eventLog.find(
      (e) => e.type === "damage-dealt" && e.target.kind === "player" && e.target.player === C,
    );
    expect(toCarol?.type === "damage-dealt" && toCarol.source).toBe(nighthawk);
  });

  it("an opponent's commander, or a noncommander, doesn't trigger it", () => {
    const { game, a } = setUp();
    spawn(game, KEDISS);
    const bears = spawn(game, "Grizzly Bears");
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil(afterCombat);
    expect([life(game, B), life(game, C)]).toEqual([18, 20]);
  });

  it("partners with any other Partner", () => {
    const registry = createDefaultRegistry();
    expect(canPairCommanders(registry, KEDISS, "Kydele, Chosen of Kruphix")).toBe(true);
    expect(canPairCommanders(registry, KEDISS, "Hope Estheim")).toBe(false);
  });
});
