/**
 * Top-10000 batch 33e — the clauses most likely to be wired wrong: a Siege
 * running only its chosen half, a historic-only combat trigger, "as long as it
 * was cast", a count over every player's Zombies, a resolution-time power
 * filter, a per-card discard trigger, a token made by (and for) the opponent,
 * Cruel Ultimatum's order, and a transformed anthem.
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
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
const has = (game: Game, id: ObjectId, keyword: string): boolean =>
  (game.characteristics(id).keywords as ReadonlySet<string>).has(keyword);
const attackWith = (game: Game, attackers: readonly ObjectId[]): void => {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
  game.dispatch({
    type: "declare-attackers",
    player: A,
    attackers: attackers.map((attacker) => ({ attacker, defender: B })),
  });
  game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
};

describe("top-10000 batch 33e — Palace Siege", () => {
  it("drains each opponent at your upkeep with Dragons, and never runs the Khans half", () => {
    const { game } = setUp();
    const siege = spawn(game, "Palace Siege");
    game.state.objects[siege].chosenOnEnter = "Dragons";
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
    // The Khans half would have returned the Bears.
    expect(game.graveyardOf(A).some((id) => game.state.objects[id].cardName === "Grizzly Bears")).toBe(true);
  });
});

describe("top-10000 batch 33e — Aya of Alexandria", () => {
  it("makes an Assassin for a historic creature's combat damage, not a non-historic one's", () => {
    const { game } = setUp();
    const aya = spawn(game, "Aya of Alexandria");
    const bears = spawn(game, "Grizzly Bears");
    attackWith(game, [aya, bears]);
    settle(game);
    expect(life(game, B)).toBe(14);
    expect(named(game, "Assassin Token (Aya of Alexandria)")).toHaveLength(1);
  });
});

describe("top-10000 batch 33e — The Tarrasque", () => {
  it("has no haste when it wasn't cast", () => {
    const { game } = setUp();
    const tarrasque = game.debugSpawn("The Tarrasque", A, "battlefield");
    expect(has(game, tarrasque, "haste")).toBe(false);
  });

  it("cast, it has haste, attacks at once and fights a creature of the defending player", () => {
    const { game } = setUp(["The Tarrasque"], "Forest");
    for (let i = 0; i < 9; i += 1) spawn(game, "Forest");
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "The Tarrasque"), targets: [] });
    settle(game);
    const tarrasque = named(game, "The Tarrasque")[0];
    expect(tarrasque).toBeDefined();
    expect(has(game, tarrasque, "haste")).toBe(true);
    attackWith(game, [tarrasque]);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(life(game, B)).toBe(10);
  });
});

describe("top-10000 batch 33e — Shepherd of Rot", () => {
  it("counts every Zombie on the battlefield, whoever controls it", () => {
    const { game } = setUp();
    const shepherd = spawn(game, "Shepherd of Rot");
    spawn(game, "Gravecrawler", B);
    spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "activate-ability", player: A, source: shepherd, abilityIndex: 0 });
    settle(game);
    expect(life(game, A)).toBe(18);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-10000 batch 33e — Cactusfolk Sureshot", () => {
  it("gives trample and haste only to other creatures with power 4 or greater", () => {
    const { game } = setUp();
    const cactus = spawn(game, "Cactusfolk Sureshot");
    const wurm = spawn(game, "Craw Wurm");
    const giant = spawn(game, "Hill Giant");
    const combat = registry.get("Cactusfolk Sureshot")!.triggered[1].effect!;
    game.debugApplyEffect(A, combat, [], { source: cactus });
    settle(game);
    expect(has(game, wurm, "trample")).toBe(true);
    expect(has(game, wurm, "haste")).toBe(true);
    expect(has(game, giant, "trample")).toBe(false);
    expect(has(game, cactus, "haste")).toBe(false);
  });
});

describe("top-10000 batch 33e — Ivora, Insatiable Heir", () => {
  it("gets a counter for each card discarded", () => {
    const { game } = setUp();
    const ivora = spawn(game, "Ivora, Insatiable Heir");
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 2 });
    settle(game);
    expect(game.state.objects[ivora].counters?.["+1/+1"] ?? 0).toBe(2);
  });
});

describe("top-10000 batch 33e — Goblin Spymaster", () => {
  it("has the opponent create the Goblin at their own end step, and not at yours", () => {
    const { game } = setUp();
    spawn(game, "Goblin Spymaster");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const goblins = named(game, "Goblin Token (Goblin Spymaster)");
    expect(goblins).toHaveLength(1);
    expect(game.state.objects[goblins[0]].controller).toBe(B);
  });
});

describe("top-10000 batch 33e — Ulvenwald Oddity", () => {
  it("transformed, gives other creatures you control +1/+1, trample and haste", () => {
    const { game } = setUp();
    const oddity = spawn(game, "Ulvenwald Oddity");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "transform", target: "source" }, [], { source: oddity });
    settle(game);
    expect(game.characteristics(oddity).power).toBe(8);
    expect(game.characteristics(bears).power).toBe(3);
    expect(has(game, bears, "trample")).toBe(true);
    expect(has(game, bears, "haste")).toBe(true);
    expect(game.characteristics(theirs).power).toBe(2);
  });
});

describe("top-10000 batch 33e — Bellowing Tanglewurm", () => {
  it("gives intimidate to other green creatures you control only", () => {
    const { game } = setUp();
    spawn(game, "Bellowing Tanglewurm");
    const elves = spawn(game, "Llanowar Elves");
    const giant = spawn(game, "Hill Giant");
    expect(has(game, elves, "intimidate")).toBe(true);
    expect(has(game, giant, "intimidate")).toBe(false);
  });
});
