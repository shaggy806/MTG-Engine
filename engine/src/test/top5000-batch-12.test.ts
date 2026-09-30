/**
 * Top-5000 batch 12 (ranks 1802–1877). No new engine vocabulary beyond the
 * discard cost (see `ability-discard-cost.test.ts`); these pin the clauses
 * most likely to be wired wrong — a mana ability granted to a token stack
 * (Springleaf Parade), counters read off another permanent's toughness as a
 * creature enters (Arwen), a count of Auras on creatures (Sage's Reverie),
 * an ETB that attaches its Equipment (Silver Shroud Costume), a kicked rule
 * over every creature this turn (Orim's Chant), "if you cast it" (Zacama),
 * and a channel ability's delayed return (Touch the Spirit Realm).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics, restrictionsOf } from "../characteristics.js";
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

describe("top-5000 batch 12 — Springleaf Parade", () => {
  it("makes X changeling tokens that each tap for mana", () => {
    const game = setUp(["Springleaf Parade"], "Forest");
    lands(game, "Forest", 5);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Springleaf Parade"), targets: [], xValue: 3 });
    settle(game);
    const shifters = named(game, "Shapeshifter Token");
    const total = shifters.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(total).toBe(3);
    // Each is summoning sick this turn: next turn, all three tap for mana.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const manaActs = game
      .legalActions(A)
      .filter((x) => x.kind === "activate-ability" && named(game, "Shapeshifter Token").includes(x.source));
    expect(manaActs.length).toBeGreaterThan(0);
    for (let i = 0; i < 3; i += 1) {
      const act = game
        .legalActions(A)
        .find((x) => x.kind === "activate-ability" && named(game, "Shapeshifter Token").includes(x.source));
      if (act === undefined || act.kind !== "activate-ability") throw new Error(`no token left to tap (${i})`);
      game.dispatch({ type: "activate-ability", player: A, source: act.source, abilityIndex: act.abilityIndex });
      settle(game);
    }
    expect(game.state.players[A].manaPool.length).toBe(3);
  });
});

describe("top-5000 batch 12 — Arwen, Weaver of Hope", () => {
  it("gives each other creature entering counters equal to her toughness", () => {
    const game = setUp();
    spawn(game, "Arwen, Weaver of Hope");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    expect(counters(game, bears)).toBe(1);
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("top-5000 batch 12 — Sage's Reverie", () => {
  it("draws and pumps for each Aura you control on a creature, itself included", () => {
    const game = setUp(["Sage's Reverie"], "Plains");
    lands(game, "Plains", 4);
    const bears = spawn(game, "Grizzly Bears");
    const hand = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Sage's Reverie"),
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(game.handOf(A).length).toBe(hand - 1 + 1);
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([3, 3]);
  });
});

describe("top-5000 batch 12 — Silver Shroud Costume", () => {
  it("attaches itself as it enters, and the creature gains shroud and can't be blocked", () => {
    const game = setUp(["Silver Shroud Costume"]);
    lands(game, "Wastes", 2);
    const bears = spawn(game, "Grizzly Bears");
    const costume = inHand(game, "Silver Shroud Costume");
    game.dispatch({ type: "cast-spell", player: A, card: costume, targets: [] });
    settle(game);
    expect(game.state.objects[costume].attachedTo).toBe(bears);
    const keywords = [...computeCharacteristics(game.state, registry, bears).keywords];
    expect(keywords).toEqual(expect.arrayContaining(["shroud", "unblockable"]));
  });
});

describe("top-5000 batch 12 — Orim's Chant", () => {
  it("kicked, stops the target casting and every creature attacking this turn", () => {
    const game = setUp(["Orim's Chant"], "Plains");
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Orim's Chant"),
      targets: [{ kind: "player", player: A }],
      kicked: true,
    });
    settle(game);
    game.debugSpawn("Lightning Bolt", A, "hand");
    spawn(game, "Mountain");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell")).toBe(false);
    // Every creature this turn, one that arrives afterwards too.
    const later = spawn(game, "Grizzly Bears", B);
    expect(restrictionsOf(game.state, registry, bears).has("cant-attack")).toBe(true);
    expect(restrictionsOf(game.state, registry, later).has("cant-attack")).toBe(true);
  });
});

describe("top-5000 batch 12 — Zacama's 'if you cast it'", () => {
  it("untaps your lands only when cast", () => {
    const game = setUp(["Zacama, Primal Calamity"]);
    const mine = lands(game, "Plains", 3).concat(lands(game, "Mountain", 3), lands(game, "Forest", 3));
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Zacama, Primal Calamity"), targets: [] });
    settle(game);
    expect(mine.every((id) => !game.state.objects[id].tapped)).toBe(true);
    const other = setUp();
    const tapped = spawn(other, "Plains");
    other.state.objects[tapped].tapped = true;
    other.debugSpawn("Zacama, Primal Calamity", A, "battlefield", { announceEntry: true });
    settle(other);
    expect(other.state.objects[tapped].tapped).toBe(true);
  });
});

describe("top-5000 batch 12 — Touch the Spirit Realm's channel", () => {
  it("exiles the target and returns it at the next end step", () => {
    const game = setUp(["Touch the Spirit Realm"], "Plains");
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    const card = inHand(game, "Touch the Spirit Realm");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: card,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(zone(game, card)).toBe("graveyard");
    expect(zone(game, bears)).toBe("exile");
    game.advanceUntil((s) => s.turn.number === 2);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].controller).toBe(B);
  });
});
