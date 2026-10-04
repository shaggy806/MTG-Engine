/**
 * Top-10000 batch 35e (round 16). No engine changes: pins Gimli's damage to
 * the dead creature's controller, Cormela's restricted three-colour mana,
 * and Dragonologist's hexproof for untapped Dragons only.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};

describe("top-10000 batch 35e — Gimli, Counter of Kills", () => {
  it("deals 1 damage to the controller of the opponent's creature that died", () => {
    const { game } = setUp();
    spawn(game, "Gimli, Counter of Kills");
    const bears = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(life(game, B)).toBe(19);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: mine }]);
    settle(game);
    expect(life(game, A)).toBe(20);
    expect(life(game, B)).toBe(19);
  });
});

describe("top-10000 batch 35e — Cormela, Glamour Thief", () => {
  it("adds {U}{B}{R} for {1}, {T}", () => {
    const { game } = setUp();
    lands(game, "Wastes", 1);
    const cormela = spawn(game, "Cormela, Glamour Thief");
    game.dispatch({ type: "activate-ability", player: A, source: cormela, abilityIndex: 0 });
    settle(game);
    expect(pool(game)).toEqual(["B", "R", "U"]);
  });
});

describe("top-10000 batch 35e — Dragonologist", () => {
  it("gives hexproof to untapped Dragons you control only", () => {
    const { game } = setUp();
    spawn(game, "Dragonologist");
    const dragon = spawn(game, "Shivan Dragon");
    const theirs = spawn(game, "Shivan Dragon", B);
    expect(computeCharacteristics(game.state, registry, dragon).keywords.has("hexproof")).toBe(true);
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("hexproof")).toBe(false);
    game.state.objects[dragon].tapped = true;
    expect(computeCharacteristics(game.state, registry, dragon).keywords.has("hexproof")).toBe(false);
  });
});
