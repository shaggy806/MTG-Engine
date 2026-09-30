/**
 * Top-5000 batch 10 (ranks 1645–1722) and what it needed: a count of your
 * graveyard's cards as an intervening-if (Oversold Cemetery —
 * `cards-in-graveyard`), persist (Glen Elendra Archmage — `persist()`), and
 * "put it on the bottom of its owner's library" naming the card that died
 * (Murderous Rider — `put-on-library`'s `"trigger-object"`). One test per
 * clause most likely to be wrong.
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

/** A player who says yes to every "you may" and finds a card when searching. */
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
const tokens = (game: Game, name: string, owner?: PlayerId): number =>
  named(game, name)
    .filter((id) => owner === undefined || game.state.objects[id].controller === owner)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
/** Resolve everything, answering "you may" and a modal choice with the first
 * option. */
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
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  settle(game);
};

describe("top-5000 batch 10 — Blood Money", () => {
  it("makes a tapped Treasure for each nontoken creature destroyed, none for tokens or indestructibles", () => {
    const game = setUp(["Blood Money"], "Swamp");
    lands(game, "Swamp", 7);
    spawn(game, "Grizzly Bears", B);
    spawn(game, "Grizzly Bears");
    spawn(game, "Darksteel Myr", B);
    game.debugApplyEffect(B, { kind: "create-token", token: "Servo Token", count: 2 }, []);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Blood Money"), targets: [] });
    settle(game);
    expect(tokens(game, "Treasure Token", A)).toBe(2);
    expect(named(game, "Treasure Token").every((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

describe("top-5000 batch 10 — Murderous Rider", () => {
  it("goes to the bottom of its owner's library when it dies", () => {
    const game = setUp();
    const rider = spawn(game, "Murderous Rider");
    destroy(game, rider);
    const library = game.state.zones.perPlayer[A].library;
    expect(library[library.length - 1]).toBe(rider);
  });
});

describe("top-5000 batch 10 — Oversold Cemetery", () => {
  const upkeep = (creatureCards: number): Game => {
    const game = setUp();
    spawn(game, "Oversold Cemetery");
    for (let i = 0; i < creatureCards; i += 1) game.debugSpawn("Grizzly Bears", A, "graveyard");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Lightning Bolt", A, "graveyard");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    return game;
  };
  const bearsInHand = (game: Game): number =>
    game.handOf(A).filter((id) => game.state.objects[id].cardName === "Grizzly Bears").length;

  it("returns a creature card with four in the graveyard", () => {
    expect(bearsInHand(upkeep(4))).toBe(1);
  });

  it("doesn't trigger with three, however many other cards", () => {
    expect(bearsInHand(upkeep(3))).toBe(0);
  });
});

describe("top-5000 batch 10 — Glen Elendra Archmage's persist", () => {
  it("returns once with a -1/-1 counter, then stays dead", () => {
    const game = setUp();
    const mage = spawn(game, "Glen Elendra Archmage");
    destroy(game, mage);
    expect(zone(game, mage)).toBe("battlefield");
    expect(counters(game, mage, "-1/-1")).toBe(1);
    destroy(game, mage);
    expect(zone(game, mage)).toBe("graveyard");
  });
});

describe("top-5000 batch 10 — Blast Zone", () => {
  it("destroys each nonland permanent with mana value equal to its charge counters as it was sacrificed", () => {
    const game = setUp();
    const blast = game.debugSpawn("Blast Zone", A, "battlefield", { summoningSick: false, announceEntry: true });
    settle(game);
    expect(counters(game, blast, "charge")).toBe(1);
    lands(game, "Wastes", 5);
    game.dispatch({ type: "activate-ability", player: A, source: blast, abilityIndex: 1, xValue: 1 });
    settle(game);
    expect(counters(game, blast, "charge")).toBe(2);
    game.state.objects[blast].tapped = false;
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", B);
    game.dispatch({ type: "activate-ability", player: A, source: blast, abilityIndex: 2 });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, elves)).toBe("battlefield");
  });
});

describe("top-5000 batch 10 — Runaway Steam-Kin", () => {
  it("grows on red spells only while it has fewer than three counters", () => {
    const game = setUp(["Lightning Bolt", "Lightning Bolt", "Lightning Bolt", "Lightning Bolt"], "Mountain");
    lands(game, "Mountain", 4);
    const kin = spawn(game, "Runaway Steam-Kin");
    for (let i = 0; i < 4; i += 1) {
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: inHand(game, "Lightning Bolt"),
        targets: [{ kind: "player", player: B }],
      });
      settle(game);
    }
    expect(counters(game, kin)).toBe(3);
  });
});

describe("top-5000 batch 10 — Jin-Gitaxias's hand size", () => {
  it("cuts each opponent's maximum hand size by seven, not its controller's", () => {
    const game = setUp();
    const g = game as unknown as { maxHandSizeOf(p: PlayerId): number };
    const before = g.maxHandSizeOf(B);
    spawn(game, "Jin-Gitaxias, Core Augur");
    expect(g.maxHandSizeOf(B)).toBe(before - 7);
    expect(g.maxHandSizeOf(A)).toBe(before);
  });
});

describe("top-5000 batch 10 — Soulherder", () => {
  it("grows when its own end-step blink exiles a creature", () => {
    const game = setUp();
    const herder = spawn(game, "Soulherder");
    spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end");
    settle(game);
    expect(counters(game, herder)).toBe(1);
  });
});

describe("top-5000 batch 10 — Obscura Storefront", () => {
  it("sacrifices itself, then fetches a tapped basic and gains 1 life", () => {
    const game = setUp([], "Island");
    const store = game.debugSpawn("Obscura Storefront", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, store)).toBe("graveyard");
    const islands = named(game, "Island");
    expect(islands.length).toBe(1);
    expect(game.state.objects[islands[0]].tapped).toBe(true);
    expect(life(game, A)).toBe(21);
  });
});

describe("top-5000 batch 10 — Nissa, Who Shakes the World", () => {
  it("animates a land for good as a 3/3 with vigilance and haste", () => {
    const game = setUp();
    const nissa = spawn(game, "Nissa, Who Shakes the World");
    const forest = spawn(game, "Forest");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: nissa,
      abilityIndex: 0,
      targets: [{ kind: "object", object: forest }],
    });
    settle(game);
    const c = computeCharacteristics(game.state, registry, forest);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("land");
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect([...c.keywords]).toEqual(expect.arrayContaining(["vigilance", "haste"]));
  });
});
