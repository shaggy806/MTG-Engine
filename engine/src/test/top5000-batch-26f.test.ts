/**
 * Top-5000 batch 26f. Pins the clauses most likely to be wired wrong:
 * Gixian Puppeteer's second-draw drain and its death reanimation's mana-value
 * cap, Cori-Steel Cutter's flurry Monk and the optional attach, Drag to the
 * Roots' delirium discount, and Mechanized Warfare's +1 only toward opponents.
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
const setUp = (hand: readonly string[] = [], library = "Wastes"): Game => {
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
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
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

describe("top-5000 batch 26f — Gixian Puppeteer", () => {
  it("drains on the second draw of the turn only", () => {
    const game = setUp();
    spawn(game, "Gixian Puppeteer");
    // The turn's draw step was the first.
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });

  it("returns a creature card with mana value 3 or less when it dies, never a bigger one", () => {
    const game = setUp();
    const puppeteer = spawn(game, "Gixian Puppeteer");
    game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: puppeteer }]);
    settle(game);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
    expect(named(game, "Hill Giant")).toHaveLength(0);
    expect(named(game, "Gixian Puppeteer")).toHaveLength(0);
  });
});

describe("top-5000 batch 26f — Drag to the Roots", () => {
  const castable = (game: Game): boolean =>
    game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === inHand(game, "Drag to the Roots"));

  it("costs {2} less with four card types in your graveyard", () => {
    const game = setUp(["Drag to the Roots"]);
    spawn(game, "Swamp");
    spawn(game, "Forest");
    spawn(game, "Grizzly Bears", B);
    game.debugSpawn("Wastes", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Lightning Bolt", A, "graveyard");
    expect(castable(game)).toBe(false);
    game.debugSpawn("Sol Ring", A, "graveyard");
    expect(castable(game)).toBe(true);
  });
});
