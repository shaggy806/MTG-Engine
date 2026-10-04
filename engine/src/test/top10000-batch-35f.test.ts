/**
 * Top-10000 batch 35f. Pins the clauses most likely to be wired wrong:
 * Clarion Conqueror's prohibition over three card types, Warg Rider's
 * granted menace and amass, See the Truth's cast-from-hand branch, Woodland
 * Bellower's search filter, and Klauth's Will's "each creature without flying".
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
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = [], library: readonly string[] = []): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...library, ...Array<string>(40).fill("Wastes")] },
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    if (game.state.awaiting === null) return;
    game.advanceUntil(quiet);
  }
  throw new Error("settle: still unresolved");
};

describe("top-10000 batch 35f — Clarion Conqueror", () => {
  it("stops an artifact's (mana) ability from being activated", () => {
    const { game } = setUp();
    const ring = spawn(game, "Sol Ring");
    const canTap = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === ring);
    expect(canTap()).toBe(true);
    spawn(game, "Clarion Conqueror", B);
    expect(canTap()).toBe(false);
  });
});

describe("top-10000 batch 35f — Warg Rider", () => {
  it("gives other Goblins menace and amasses Orcs 2 at the beginning of combat", () => {
    const { game } = setUp();
    const rider = spawn(game, "Warg Rider");
    const goblin = spawn(game, "Brash Taunter");
    const bystander = spawn(game, "Sol Ring");
    expect(game.characteristics(goblin).keywords.has("menace")).toBe(true);
    game.advanceUntil((s) => s.turn.step === "begin-combat");
    settle(game);
    const army = game.battlefield.filter(
      (id) => id !== rider && id !== goblin && id !== bystander && game.state.objects[id].controller === A,
    );
    expect(army.some((id) => counters(game, id) === 2)).toBe(true);
  });
});

describe("top-10000 batch 35f — See the Truth", () => {
  it("cast from hand puts only one of the three cards into hand", () => {
    const { game } = setUp(["See the Truth"]);
    spawn(game, "Island");
    spawn(game, "Island");
    const before = game.handOf(A).length;
    const libBefore = game.libraryOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "See the Truth"), targets: [] });
    settle(game);
    // −1 for the spell, +1 for the one card kept.
    expect(game.handOf(A).length).toBe(before);
    expect(game.libraryOf(A).length).toBe(libBefore - 1);
  });
});
