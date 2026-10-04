/**
 * Top-5000 batch 21a. No engine change: each card is an existing shape. These
 * pin the clauses most likely to be wired wrong — Torrential Gearhulk's free
 * graveyard cast (exiled after) seen by Vega's "from anywhere other than your
 * hand", Reckless Handling's "if an artifact card was discarded this way",
 * Bloodsoaked Insight's life-lost reduction and impulse from an opponent's
 * library, Shimmer Dragon's artifact-count hexproof, Master of Dark Rites'
 * "another" sacrifice, and Vein Ripper's drain.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  a.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
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

describe("top-5000 batch 21a — Torrential Gearhulk and Vega, the Watcher", () => {
  it("casts an instant from the graveyard for free, exiles it, and Vega draws for it", () => {
    const { game, a } = setUp();
    spawn(game, "Vega, the Watcher");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    let offeredFree: boolean | undefined;
    a.chooseCastNowFn = (_view, offer) => {
      offeredFree = offer.free;
      return { type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }], via: "effect", free: true };
    };
    const hand = game.handOf(A).length;
    // No lands at all: the Bolt is paid for by nothing.
    game.debugSpawn("Torrential Gearhulk", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(offeredFree).toBe(true);
    expect(life(game, B)).toBe(17);
    expect(zone(game, bolt)).toBe("exile");
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });

  it("Vega doesn't draw for a spell cast from the hand", () => {
    const { game } = setUp(["Lightning Bolt"]);
    spawn(game, "Vega, the Watcher");
    lands(game, "Mountain", 1);
    const hand = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(life(game, B)).toBe(17);
    expect(game.handOf(A)).toHaveLength(hand - 1);
  });
});

describe("top-5000 batch 21a — Reckless Handling", () => {
  it("deals 2 to each opponent when the random discard is an artifact", () => {
    // Every other card in hand (and the find) is a Sol Ring.
    const { game } = setUp(["Reckless Handling"], "Sol Ring");
    lands(game, "Mountain", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Reckless Handling"), targets: [] });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(game.graveyardOf(A).some((id) => game.state.objects[id].cardName === "Sol Ring")).toBe(true);
  });

  it("deals nothing when no artifact card is discarded", () => {
    const { game } = setUp(["Reckless Handling"], "Mountain");
    lands(game, "Mountain", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Reckless Handling"), targets: [] });
    settle(game);
    expect(life(game, B)).toBe(20);
    // It still discarded a card at random, with no artifact found.
    expect(game.graveyardOf(A).some((id) => game.state.objects[id].cardName === "Mountain")).toBe(true);
  });
});

describe("top-5000 batch 21a — Bloodsoaked Insight", () => {
  it("costs {1} less per life opponents lost, and lets you play the opponent's exiled cards", () => {
    const { game } = setUp(["Bloodsoaked Insight"]);
    lands(game, "Swamp", 2);
    const insight = inHand(game, "Bloodsoaked Insight");
    const castable = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === insight);
    expect(castable()).toBe(false);
    game.debugApplyEffect(A, { kind: "lose-life", amount: 5, target: 0 }, [{ kind: "player", player: B }]);
    settle(game);
    expect(castable()).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: insight, targets: [{ kind: "player", player: B }] });
    settle(game);
    const exiled = game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === B);
    expect(exiled).toHaveLength(3);
    expect(game.legalActions(A).some((x) => x.kind === "play-land" && exiled.includes(x.card))).toBe(true);
  });
});

describe("top-5000 batch 21a — Shimmer Dragon", () => {
  it("has hexproof only while you control four or more artifacts", () => {
    const { game } = setUp();
    const dragon = spawn(game, "Shimmer Dragon");
    lands(game, "Sol Ring", 3);
    expect(game.characteristics(dragon).keywords.has("hexproof")).toBe(false);
    spawn(game, "Sol Ring", B);
    expect(game.characteristics(dragon).keywords.has("hexproof")).toBe(false);
    spawn(game, "Sol Ring");
    expect(game.characteristics(dragon).keywords.has("hexproof")).toBe(true);
  });
});

describe("top-5000 batch 21a — Master of Dark Rites", () => {
  it("sacrifices another creature, never itself, for {B}{B}{B}", () => {
    const { game } = setUp();
    const master = spawn(game, "Master of Dark Rites");
    const bears = spawn(game, "Grizzly Bears");
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === master && x.abilityIndex === 0);
    expect(offer?.kind === "activate-ability" ? offer.sacrifice?.choices : null).toEqual([bears]);
    game.dispatch({ type: "activate-ability", player: A, source: master, abilityIndex: 0, sacrifice: bears });
    expect(pool(game)).toEqual(["B", "B", "B"]);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, master)).toBe("battlefield");
  });
});

describe("top-5000 batch 21a — Vein Ripper", () => {
  it("drains 2 whenever a creature dies, an opponent's included", () => {
    const { game } = setUp();
    spawn(game, "Vein Ripper");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });
});
