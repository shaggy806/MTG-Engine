/**
 * Alela, Cunning Conqueror — {2}{U}{B} legendary 2/4 Faerie Warlock.
 *
 *   Flying
 *   Whenever you cast your first spell during each opponent's turn, create a
 *   1/1 black Faerie Rogue creature token with flying.
 *   Whenever one or more Faeries you control deal combat damage to a player,
 *   goad target creature that player controls.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { goadersOf } from "../goad.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();
const ALELA = "Alela, Cunning Conqueror";

const setUp = (players: readonly PlayerId[]) => {
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
  return { game, a: controllers[A] as ScriptedController };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const rogues = (game: Game): number =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Faerie Rogue Token").length;
const castOpt = (game: Game): void => {
  game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Opt", A, "hand") });
  game.advanceUntil(quiet);
};

describe("Alela, Cunning Conqueror", () => {
  it("makes a Faerie Rogue for your first spell during an opponent's turn — not the second, not on your own", () => {
    const { game } = setUp([A, B]);
    spawn(game, ALELA, A);
    for (let i = 0; i < 3; i += 1) spawn(game, "Island", A);
    castOpt(game);
    expect(rogues(game)).toBe(0);

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === A);
    castOpt(game);
    expect(rogues(game)).toBe(1);
    const rogue = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Faerie Rogue Token",
    )!;
    const c = game.characteristics(rogue);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect(c.keywords.has("flying")).toBe(true);
    expect([...c.colors]).toEqual(["B"]);
    expect(game.state.objects[rogue].controller).toBe(A);

    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    castOpt(game);
    expect(rogues(game)).toBe(1);
  });

  it("goads a creature controlled by the player the Faeries hit, and only that player's", () => {
    const { game, a } = setUp([A, B, C]);
    const alela = spawn(game, ALELA, A);
    spawn(game, "Grizzly Bears", A);
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    spawn(game, "Grizzly Bears", C);
    let offered: readonly TargetRef[] = [];
    a.declareAttackersFn = () => [{ attacker: alela, defender: B }];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options[0] ?? [];
      return [{ kind: "object", object: giant }];
    };
    const life = game.state.players[B].life;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.players[B].life).toBe(life - 2);
    expect(offered.map((t) => (t.kind === "object" ? t.object : t.player)).sort()).toEqual([bears, giant].sort());
    expect(goadersOf(game.state, registry, giant)).toEqual([A]);
    expect(goadersOf(game.state, registry, bears)).toEqual([]);
  });

  it("doesn't goad when a non-Faerie deals the damage", () => {
    const { game, a } = setUp([A, B]);
    spawn(game, ALELA, A);
    const bears = spawn(game, "Grizzly Bears", A);
    const giant = spawn(game, "Hill Giant", B);
    let asked = false;
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    a.chooseTargetsFn = () => {
      asked = true;
      return [{ kind: "object", object: giant }];
    };
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(asked).toBe(false);
    expect(goadersOf(game.state, registry, giant)).toEqual([]);
  });
});
