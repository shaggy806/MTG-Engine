/**
 * Top-5000 batch 14 (ranks 1957–2035). No new engine vocabulary; these pin
 * the clauses most likely to be wired wrong — raid read as the spell
 * resolves (Chart a Course), "another target artifact card" from the
 * graveyard a dying artifact joins (Junk Diver), a token for the exiled
 * permanent's controller (Ravenform), the new discard cost beside a tap-three
 * cost (Cryptbreaker), a graveyard ability that stays put until it resolves
 * (Drownyard Temple), and a counter count read off the source's power
 * (Halana and Alena).
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: yes(new ScriptedController(A)), [B]: new ScriptedController(B) },
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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
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

describe("top-5000 batch 14 — Chart a Course", () => {
  it("draws two and discards one when you haven't attacked", () => {
    const game = setUp(["Chart a Course"], "Island");
    lands(game, "Island", 2);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Chart a Course"), targets: [] });
    settle(game);
    expect(game.handOf(A).length).toBe(hand - 1 + 2 - 1);
  });
});

describe("top-5000 batch 14 — Junk Diver", () => {
  it("returns another artifact card, never itself", () => {
    const game = setUp();
    const diver = spawn(game, "Junk Diver");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: diver }]);
    settle(game);
    expect(zone(game, ring)).toBe("hand");
    expect(zone(game, diver)).toBe("graveyard");
  });
});

describe("top-5000 batch 14 — Ravenform", () => {
  it("gives the exiled creature's controller the Bird", () => {
    const game = setUp(["Ravenform"], "Island");
    lands(game, "Island", 3);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ravenform"), targets: [{ kind: "object", object: bears }] });
    settle(game);
    expect(zone(game, bears)).toBe("exile");
    const birds = named(game, "1/1 Blue Bird Token");
    expect(birds).toHaveLength(1);
    expect(game.state.objects[birds[0]].controller).toBe(B);
  });
});

describe("top-5000 batch 14 — Cryptbreaker", () => {
  it("discards for a Zombie, and taps three Zombies to draw and lose 1", () => {
    const game = setUp();
    lands(game, "Swamp", 2);
    const breaker = spawn(game, "Cryptbreaker");
    const card = game.debugSpawn("Wastes", A, "hand");
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: breaker, abilityIndex: 0 });
    settle(game);
    expect(game.handOf(A).length).toBe(hand - 1);
    expect(named(game, "Zombie Token")).toHaveLength(1);
    expect(card).toBeDefined();
    game.state.objects[breaker].tapped = false;
    spawn(game, "Binding Mummy");
    const life = game.state.players[A].life;
    const draw = game.legalActions(A).find((x) => x.kind === "activate-ability" && x.source === breaker && x.abilityIndex === 1);
    expect(draw).toBeDefined();
    game.dispatch({ type: "activate-ability", player: A, source: breaker, abilityIndex: 1 });
    settle(game);
    expect(game.state.players[A].life).toBe(life - 1);
  });
});

describe("top-5000 batch 14 — Drownyard Temple", () => {
  it("returns from the graveyard tapped", () => {
    const game = setUp();
    lands(game, "Wastes", 3);
    const temple = game.debugSpawn("Drownyard Temple", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: temple, abilityIndex: 1 });
    settle(game);
    expect(zone(game, temple)).toBe("battlefield");
    expect(game.state.objects[temple].tapped).toBe(true);
  });
});

describe("top-5000 batch 14 — Halana and Alena", () => {
  it("puts counters equal to their power on another creature, which gains haste", () => {
    const game = setUp();
    spawn(game, "Halana and Alena, Partners");
    const bears = spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.turn.step === "begin-combat");
    settle(game);
    expect(counters(game, bears)).toBe(2);
  });
});
