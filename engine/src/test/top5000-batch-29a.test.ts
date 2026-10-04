/**
 * Top-5000 batch 29a. No engine change: each test pins the clause most likely
 * to be wired wrong — Sporocyst's X read by its enters trigger, Braids's edict
 * aimed at whoever's upkeep it is, On the Trail's second draw, Barbarian
 * Ring's threshold gate, Thalia's Lieutenant's "other Human", Avatar Roku's
 * "a player attacks" and its combat-long mana, Lumbering Falls's animation,
 * Goblin Lackey's drop, Open the Gates's Gate, Lupinflower Village's dig,
 * Helm of the Gods's count and Adriana's granted melee.
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
const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
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

describe("top-5000 batch 29a — Sporocyst", () => {
  it("enters with X counters and fetches up to X basic lands tapped", () => {
    const { game, a } = setUp(["Sporocyst"], "Forest");
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
    lands(game, "Forest", 5);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sporocyst"), targets: [], xValue: 2 });
    settle(game);
    const [sporocyst] = named(game, "Sporocyst");
    expect(sporocyst).toBeDefined();
    expect(counters(game, sporocyst)).toBe(2);
    const forests = named(game, "Forest");
    // Five paid with, two found — no more than X.
    expect(forests).toHaveLength(7);
    expect(forests.every((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

describe("top-5000 batch 29a — Braids, Cabal Minion", () => {
  it("makes the player whose upkeep it is sacrifice, and only them", () => {
    const { game } = setUp();
    const braids = spawn(game, "Braids, Cabal Minion");
    const bears = spawn(game, "Grizzly Bears", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, braids)).toBe("battlefield");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(zone(game, braids)).toBe("graveyard");
  });
});

describe("top-5000 batch 29a — On the Trail", () => {
  it("puts a land from hand onto the battlefield tapped on the second draw of the turn", () => {
    const { game } = setUp(["Forest"]);
    spawn(game, "On the Trail");
    const landsOut = (): ObjectId[] =>
      game.battlefield.filter(
        (id) => game.state.objects[id].controller === A && game.characteristics(id).types.includes("land"),
      );
    expect(landsOut()).toHaveLength(0);
    // The turn's draw step drew the first card; this is the second.
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    const out = landsOut();
    expect(out).toHaveLength(1);
    expect(game.state.objects[out[0]].tapped).toBe(true);
  });
});

describe("top-5000 batch 29a — Barbarian Ring", () => {
  it("can be sacrificed for 2 damage only with seven cards in the graveyard", () => {
    const { game } = setUp();
    const ring = spawn(game, "Barbarian Ring");
    spawn(game, "Mountain");
    const offered = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === ring && x.abilityIndex === 1);
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Grizzly Bears", A, "graveyard");
    expect(offered()).toBe(false);
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    expect(offered()).toBe(true);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: ring,
      abilityIndex: 1,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(zone(game, ring)).toBe("graveyard");
  });

  it("deals 1 damage to you for its red", () => {
    const { game } = setUp();
    const ring = spawn(game, "Barbarian Ring");
    game.dispatch({ type: "activate-ability", player: A, source: ring, abilityIndex: 0 });
    expect(pool(game)).toEqual(["R"]);
    expect(life(game, A)).toBe(19);
  });
});

describe("top-5000 batch 29a — Thalia's Lieutenant", () => {
  it("counters each other Human on entering, then grows with each Human after", () => {
    const { game } = setUp();
    const vanguard = spawn(game, "Elite Vanguard");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Elite Vanguard", B);
    const lieutenant = game.debugSpawn("Thalia's Lieutenant", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, vanguard)).toBe(1);
    expect(counters(game, bears)).toBe(0);
    expect(counters(game, theirs)).toBe(0);
    expect(counters(game, lieutenant)).toBe(0);
    game.debugSpawn("Elite Vanguard", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, lieutenant)).toBe(1);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, lieutenant)).toBe(1);
  });
});

describe("top-5000 batch 29a — Avatar Roku, Firebender", () => {
  it("adds six red when an opponent attacks, kept through combat and gone after", () => {
    const { game, b } = setUp();
    spawn(game, "Avatar Roku, Firebender");
    const bears = spawn(game, "Grizzly Bears", B);
    b.declareAttackersFn = () => [{ attacker: bears, defender: A }];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "declare-blockers");
    expect(pool(game, A)).toEqual(["R", "R", "R", "R", "R", "R"]);
    expect(pool(game, B)).toEqual([]);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    expect(pool(game, A)).toEqual([]);
  });

  it("doesn't trigger when nobody attacks", () => {
    const { game } = setUp();
    spawn(game, "Avatar Roku, Firebender");
    game.advanceUntil((s) => s.turn.step === "declare-blockers" || s.turn.step === "postcombat-main");
    expect(pool(game, A)).toEqual([]);
  });
});

describe("top-5000 batch 29a — Lumbering Falls", () => {
  it("becomes a 3/3 green and blue Elemental with hexproof that's still a land", () => {
    const { game } = setUp();
    const falls = spawn(game, "Lumbering Falls");
    lands(game, "Forest", 2);
    lands(game, "Island", 2);
    game.dispatch({ type: "activate-ability", player: A, source: falls, abilityIndex: 1, targets: [] });
    settle(game);
    const c = game.characteristics(falls);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("land");
    expect(c.subtypes).toContain("Elemental");
    expect([...c.colors].sort()).toEqual(["G", "U"]);
    expect(c.keywords.has("hexproof")).toBe(true);
  });
});

describe("top-5000 batch 29a — Goblin Lackey", () => {
  it("drops a Goblin from hand when it deals damage to a player", () => {
    const { game, a } = setUp(["Grizzly Bears", "Raging Goblin"]);
    const lackey = spawn(game, "Goblin Lackey");
    a.declareAttackersFn = () => [{ attacker: lackey, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(named(game, "Raging Goblin")).toHaveLength(1);
    expect(named(game, "Grizzly Bears")).toHaveLength(0);
  });
});

describe("top-5000 batch 29a — Open the Gates", () => {
  it("finds a Gate that isn't basic", () => {
    const { game } = setUp(["Open the Gates"], "Grizzly Bears");
    spawn(game, "Forest");
    const gate = game.debugSpawn("Azorius Guildgate", A, "library");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Open the Gates"), targets: [] });
    settle(game);
    expect(zone(game, gate)).toBe("hand");
  });
});

describe("top-5000 batch 29a — Lupinflower Village", () => {
  it("digs six deep for a Rabbit and sacrifices itself", () => {
    const { game } = setUp();
    const village = spawn(game, "Lupinflower Village");
    lands(game, "Plains", 2);
    // Five Wastes above the Rabbit: it's the sixth card down.
    const rabbit = game.debugSpawn("Jacked Rabbit", A, "library");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Wastes", A, "library");
    game.dispatch({ type: "activate-ability", player: A, source: village, abilityIndex: 2, targets: [] });
    settle(game);
    expect(zone(game, rabbit)).toBe("hand");
    expect(zone(game, village)).toBe("graveyard");
  });
});

describe("top-5000 batch 29a — Helm of the Gods", () => {
  it("gives +1/+1 for each enchantment you control", () => {
    const { game } = setUp();
    const helm = spawn(game, "Helm of the Gods");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Rhystic Study");
    spawn(game, "Rhystic Study");
    spawn(game, "Rhystic Study", B);
    spawn(game, "Wastes");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: helm,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    const c = game.characteristics(bears);
    expect([c.power, c.toughness]).toEqual([4, 4]);
  });
});

describe("top-5000 batch 29a — Adriana, Captain of the Guard", () => {
  it("has melee and gives it to each other attacker", () => {
    const { game, a } = setUp();
    const adriana = spawn(game, "Adriana, Captain of the Guard");
    const giant = spawn(game, "Hill Giant");
    a.declareAttackersFn = () => [
      { attacker: adriana, defender: B },
      { attacker: giant, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.characteristics(adriana).power).toBe(5);
    expect(game.characteristics(giant).power).toBe(4);
    expect(game.characteristics(giant).toughness).toBe(4);
  });
});
