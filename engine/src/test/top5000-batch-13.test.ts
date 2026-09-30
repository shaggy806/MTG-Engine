/**
 * Top-5000 batch 13 (ranks 1880–1956). No new engine vocabulary; these pin
 * the clauses most likely to be wired wrong — power-only CDAs (Bronze
 * Guardian, Nighthawk Scavenger), "you may discard a card. If you do, draw"
 * with nothing to discard (Hazoret's Monument), the sacrificed creature's
 * supertype (Nasty End), a search by the destroyed permanent's controller
 * (Erode), a historic cast trigger (Teshar), and a cost reduction for every
 * player (Helm of Awakening).
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
const setUp = (hand: readonly string[] = [], library = "Wastes", handB: readonly string[] = [], libraryB = "Wastes"): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: yes(new ScriptedController(A)), [B]: yes(new ScriptedController(B)) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: [...handB, ...Array<string>(40).fill(libraryB)] },
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
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
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
const castable = (game: Game, card: ObjectId, player: PlayerId = A): boolean =>
  game.legalActions(player).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 13 — power-only CDAs", () => {
  it("Bronze Guardian's power counts your artifacts and its toughness stays 5", () => {
    const game = setUp();
    const guardian = spawn(game, "Bronze Guardian");
    spawn(game, "Sol Ring");
    spawn(game, "Sol Ring", B);
    expect(pt(game, guardian)).toEqual([2, 5]);
  });

  it("Nighthawk Scavenger is 1 plus the card types in opponents' graveyards", () => {
    const game = setUp();
    const hawk = spawn(game, "Nighthawk Scavenger");
    expect(pt(game, hawk)).toEqual([1, 3]);
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugSpawn("Lightning Bolt", B, "graveyard");
    game.debugSpawn("Sol Ring", A, "graveyard");
    expect(pt(game, hawk)).toEqual([3, 3]);
  });
});

describe("top-5000 batch 13 — Hazoret's Monument", () => {
  it("draws only if a card was discarded", () => {
    const game = setUp(["Grizzly Bears"], "Forest");
    lands(game, "Forest", 2);
    spawn(game, "Hazoret's Monument");
    // Only the Bears in hand, once it's cast: nothing to discard, nothing drawn.
    for (const id of game.handOf(A).filter((id) => game.state.objects[id].cardName !== "Grizzly Bears")) {
      game.state.zones.perPlayer[A].hand.splice(game.state.zones.perPlayer[A].hand.indexOf(id), 1);
      game.state.zones.perPlayer[A].library.push(id);
      game.state.objects[id].zone = "library";
    }
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(0);
  });
});

describe("top-5000 batch 13 — Hazoret's Monument, with a card to discard", () => {
  it("discards it and draws", () => {
    const game = setUp(["Grizzly Bears"], "Forest");
    lands(game, "Forest", 2);
    spawn(game, "Hazoret's Monument");
    const keep = game.handOf(A).filter((id) => game.state.objects[id].cardName !== "Grizzly Bears");
    for (const id of keep.slice(1)) {
      game.state.zones.perPlayer[A].hand.splice(game.state.zones.perPlayer[A].hand.indexOf(id), 1);
      game.state.zones.perPlayer[A].library.push(id);
      game.state.objects[id].zone = "library";
    }
    const spare = keep[0];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(zone(game, spare)).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(1);
  });
});

describe("top-5000 batch 13 — Nasty End", () => {
  it("draws three for a legendary creature, two otherwise", () => {
    const game = setUp(["Nasty End", "Nasty End"], "Swamp");
    lands(game, "Swamp", 4);
    const legend = spawn(game, "Isamaru, Hound of Konda");
    const bears = spawn(game, "Grizzly Bears");
    const hand0 = game.handOf(A).length;
    const [first, second] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Nasty End");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [], sacrifice: legend });
    settle(game);
    expect(game.handOf(A).length).toBe(hand0 - 1 + 3);
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [], sacrifice: bears });
    settle(game);
    expect(game.handOf(A).length).toBe(hand0 - 2 + 5);
  });
});

describe("top-5000 batch 13 — Erode", () => {
  it("lets the destroyed creature's controller fetch a tapped basic", () => {
    const game = setUp(["Erode"], "Plains", [], "Forest");
    lands(game, "Plains", 1);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Erode"), targets: [{ kind: "object", object: bears }] });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    const forests = named(game, "Forest");
    expect(forests).toHaveLength(1);
    expect(game.state.objects[forests[0]].controller).toBe(B);
    expect(game.state.objects[forests[0]].tapped).toBe(true);
  });
});

describe("top-5000 batch 13 — Teshar, Ancestor's Apostle", () => {
  it("returns a small creature when you cast an artifact, not a plain creature", () => {
    const game = setUp(["Grizzly Bears", "Sol Ring"], "Forest");
    lands(game, "Forest", 3);
    spawn(game, "Teshar, Ancestor's Apostle");
    const elves = game.debugSpawn("Llanowar Elves", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(zone(game, elves)).toBe("graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring"), targets: [] });
    settle(game);
    expect(zone(game, elves)).toBe("battlefield");
  });
});

describe("top-5000 batch 13 — Helm of Awakening", () => {
  it("makes every player's spells cost {1} less", () => {
    const game = setUp([], "Wastes", ["Hill Giant"]);
    lands(game, "Mountain", 3, B);
    const giant = inHand(game, "Hill Giant", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    expect(castable(game, giant, B)).toBe(false);
    spawn(game, "Helm of Awakening");
    expect(castable(game, giant, B)).toBe(true);
  });
});
