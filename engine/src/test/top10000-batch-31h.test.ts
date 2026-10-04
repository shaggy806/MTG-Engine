/**
 * Top-10000 batch 31h — the clauses most likely to be wired wrong: a granted
 * copy ability whose "this creature" is its holder (Splinter Twin), a CDA
 * counting only your own graveyard (Splinterfright), "one of those on top,
 * the rest on the bottom" (Cream of the Crop), a mana-value "4 or 5" search
 * (Transit Mage), a once-a-turn counter trigger that skips its source
 * (Generous Pup), an optional graveyard target beside a draw (Conjurer's
 * Bauble), an artifact-cast token (Pinnacle Emissary), and Kellan, the Kid's
 * "if you don't" land drop off a spell cast from a graveyard.
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
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

describe("top-10000 batch 31h — Splinter Twin", () => {
  it("gives the enchanted creature a hasty token copy of itself, exiled at the next end step", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const twin = game.debugSpawn("Splinter Twin", A, "battlefield");
    game.state.objects[twin].attachedTo = bears;
    const grant = game.legalActions(A).find((x) => x.kind === "activate-ability" && x.source === bears);
    if (grant?.kind !== "activate-ability") throw new Error("Splinter Twin granted nothing");
    game.dispatch({ type: "activate-ability", player: A, source: bears, abilityIndex: grant.abilityIndex, targets: [] });
    settle(game);
    const copies = named(game, "Grizzly Bears").filter((id) => id !== bears);
    expect(copies).toHaveLength(1);
    const token = copies[0];
    expect(game.state.objects[token].isToken).toBe(true);
    expect(game.state.objects[token].controller).toBe(A);
    expect(computeCharacteristics(game.state, registry, token).keywords.has("haste")).toBe(true);
    expect(game.state.objects[bears].tapped).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(named(game, "Grizzly Bears")).toEqual([bears]);
  });
});

describe("top-10000 batch 31h — Splinterfright", () => {
  it("counts creature cards in its controller's graveyard only", () => {
    const { game } = setUp();
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugSpawn("Forest", A, "graveyard");
    game.debugSpawn("Hill Giant", B, "graveyard");
    const fright = spawn(game, "Splinterfright");
    const c = computeCharacteristics(game.state, registry, fright);
    expect([c.power, c.toughness]).toEqual([2, 2]);
  });
});

describe("top-10000 batch 31h — Cream of the Crop", () => {
  it("looks at power-many cards, keeps the chosen one on top and bottoms the rest", () => {
    const { game, a } = setUp();
    spawn(game, "Cream of the Crop");
    const library = (): readonly ObjectId[] => game.state.zones.perPlayer[A].library;
    const before = library().length;
    const top = library().slice(0, 3);
    let first = true;
    a.chooseFromZoneFn = (_view, eligible, min, max) => {
      if (first) {
        first = false;
        expect(eligible).toEqual(top);
        return [eligible[1]];
      }
      return eligible.slice(0, Math.max(min, Math.min(max, eligible.length)));
    };
    game.debugSpawn("Hill Giant", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(first).toBe(false);
    expect(library().length).toBe(before);
    expect(library()[0]).toBe(top[1]);
    expect([...library().slice(-2)].sort()).toEqual([top[0], top[2]].sort());
  });
});

describe("top-10000 batch 31h — Transit Mage", () => {
  it("finds only an artifact card with mana value 4 or 5", () => {
    const { game, a } = setUp();
    for (const name of ["Mind Stone", "Chromatic Lantern", "Solemn Simulacrum", "Gilded Lotus"]) {
      game.debugSpawn(name, A, "library");
    }
    let offered: string[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible.map((id) => game.state.objects[id].cardName).sort();
      return eligible.slice(0, 1);
    };
    game.debugSpawn("Transit Mage", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(offered).toEqual(["Gilded Lotus", "Solemn Simulacrum"]);
    const found = game.handOf(A).filter((id) =>
      ["Gilded Lotus", "Solemn Simulacrum"].includes(game.state.objects[id].cardName),
    );
    expect(found).toHaveLength(1);
  });
});

describe("top-10000 batch 31h — Generous Pup", () => {
  it("spreads one counter to each other creature you control, once a turn", () => {
    const { game } = setUp();
    const pup = spawn(game, "Generous Pup");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const grow = { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 } as const;
    game.debugApplyEffect(A, grow, [{ kind: "object", object: pup }]);
    settle(game);
    game.debugApplyEffect(A, grow, [{ kind: "object", object: pup }]);
    settle(game);
    expect(counters(game, pup)).toBe(4);
    expect(counters(game, bears)).toBe(1);
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("top-10000 batch 31h — Pinnacle Emissary", () => {
  it("makes a flying Drone that can block only fliers when you cast an artifact spell", () => {
    const { game } = setUp(["Ornithopter", "Grizzly Bears"]);
    spawn(game, "Pinnacle Emissary");
    for (let i = 0; i < 2; i += 1) spawn(game, "Forest");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(named(game, "Drone Token")).toHaveLength(0);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    const drones = named(game, "Drone Token");
    expect(drones).toHaveLength(1);
    const c = computeCharacteristics(game.state, registry, drones[0]);
    expect(c.keywords.has("flying")).toBe(true);
    expect([c.power, c.toughness]).toEqual([1, 1]);
  });
});

describe("top-10000 batch 31h — Kellan, the Kid", () => {
  it("off a flashback cast, with no permanent spell cheap enough, puts a land from hand onto the battlefield", () => {
    // The hand is Forest and Hill Giants (mana value 4); Think Twice is 2.
    const { game } = setUp(["Forest"], "Hill Giant");
    spawn(game, "Kellan, the Kid");
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    const twice = game.debugSpawn("Think Twice", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: twice, targets: [], via: "flashback" });
    settle(game);
    expect(named(game, "Forest")).toHaveLength(1);
    expect(named(game, "Hill Giant")).toHaveLength(0);
  });

  it("doesn't trigger on a spell cast from your hand", () => {
    const { game } = setUp(["Forest", "Grizzly Bears"], "Hill Giant");
    spawn(game, "Kellan, the Kid");
    for (let i = 0; i < 2; i += 1) spawn(game, "Forest");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(named(game, "Forest")).toHaveLength(2);
  });
});
