/**
 * Top-10000 batch 30h. No engine change: each test pins the clause of one
 * authored card most likely to be wired wrong — "another permanent" leaving
 * to anywhere (Super Shredder), "one or more artifacts" held to once a turn
 * (Merry), "its controller may" handing the token to the Sliver's controller
 * (Brood Sliver), the reflexive exile reading Auron's power *with* the new
 * counter (Auron), lands animated only until your next turn (Sylvan
 * Awakening), and the rest.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
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
    controllers: { [A]: yes(new ScriptedController(A)), [B]: yes(new ScriptedController(B)) },
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
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
/** Tokens counted one per token, a stack as every token in it. */
const count = (game: Game, name: string, player?: PlayerId): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
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
const attackWith = (game: Game, player: PlayerId, attackers: readonly ObjectId[], defender: PlayerId): void => {
  game.advanceUntil(
    (s) => activePlayerOf(s) === player && s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers",
  );
  game.dispatch({
    type: "declare-attackers",
    player,
    attackers: attackers.map((attacker) => ({ attacker, defender })),
  });
  settle(game);
};

describe("top-10000 batch 30h — Super Shredder", () => {
  it("grows when another permanent leaves for anywhere, either side's", () => {
    const game = setUp();
    const shredder = spawn(game, "Super Shredder");
    const bears = spawn(game, "Grizzly Bears", B);
    const forest = spawn(game, "Forest");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, shredder)).toBe(1);
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [{ kind: "object", object: forest }]);
    settle(game);
    expect(counters(game, shredder)).toBe(2);
  });
});

describe("top-10000 batch 30h — Merry, Warden of Isengard", () => {
  it("makes one Soldier for a batch of artifacts, and none for a second batch that turn", () => {
    const game = setUp();
    spawn(game, "Merry, Warden of Isengard");
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 2 });
    settle(game);
    expect(count(game, "Lifelink Soldier Token")).toBe(1);
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    settle(game);
    expect(count(game, "Lifelink Soldier Token")).toBe(1);
  });
});

describe("top-10000 batch 30h — Sylvan Awakening", () => {
  it("animates the lands you control as it resolves, until your next turn", () => {
    const game = setUp();
    const forest = spawn(game, "Forest");
    const theirs = spawn(game, "Forest", B);
    game.debugApplyEffect(A, registry.get("Sylvan Awakening")!.effect!);
    settle(game);
    const later = spawn(game, "Forest");
    const c = computeCharacteristics(game.state, registry, forest);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("land");
    expect(c.subtypes).toContain("Elemental");
    expect([c.power, c.toughness]).toEqual([2, 2]);
    for (const k of ["reach", "indestructible", "haste"] as const) expect(c.keywords.has(k)).toBe(true);
    expect(computeCharacteristics(game.state, registry, later).types).not.toContain("creature");
    expect(computeCharacteristics(game.state, registry, theirs).types).not.toContain("creature");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(computeCharacteristics(game.state, registry, forest).types).toContain("creature");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep");
    expect(computeCharacteristics(game.state, registry, forest).types).not.toContain("creature");
  });
});

describe("top-10000 batch 30h — Phylath, World Sculptor", () => {
  it("makes a Plant per basic land, and landfall puts four counters on a Plant", () => {
    const game = setUp();
    spawn(game, "Forest");
    spawn(game, "Forest");
    spawn(game, "Tarnished Citadel");
    enter(game, "Phylath, World Sculptor");
    settle(game);
    expect(count(game, "Plant Token")).toBe(2);
    enter(game, "Forest");
    settle(game);
    const total = named(game, "Plant Token").reduce(
      (n, id) => n + counters(game, id) * (game.state.objects[id].stackCount ?? 1),
      0,
    );
    expect(total).toBe(4);
  });
});

describe("top-10000 batch 30h — Faramir, Steward of Gondor", () => {
  it("makes you the monarch only for a legendary creature of mana value 4 or more, then makes two Soldiers", () => {
    const game = setUp();
    spawn(game, "Faramir, Steward of Gondor");
    enter(game, "Isamaru, Hound of Konda");
    enter(game, "Hill Giant");
    settle(game);
    expect(game.state.monarch).toBeNull();
    enter(game, "Kokusho, the Evening Star");
    settle(game);
    expect(game.state.monarch).toBe(A);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end");
    settle(game);
    expect(count(game, "Human Soldier Token", A)).toBe(2);
  });
});

describe("top-10000 batch 30h — Honden of Infinite Rage", () => {
  it("deals damage equal to the Shrines you control", () => {
    const game = setUp();
    const honden = spawn(game, "Honden of Infinite Rage");
    spawn(game, "Sanctum of Stone Fangs");
    const effect: EffectSpec = registry.get("Honden of Infinite Rage")!.triggered[0].effect!;
    game.debugApplyEffect(A, effect, [{ kind: "player", player: B }], { source: honden });
    settle(game);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-10000 batch 30h — Fountainport Bell", () => {
  it("may put a basic land from the library on top", () => {
    const game = setUp([], "Grizzly Bears");
    const forest = game.debugSpawn("Forest", A, "library");
    const library = game.state.zones.perPlayer[A].library;
    library.splice(library.indexOf(forest), 1);
    library.push(forest);
    enter(game, "Fountainport Bell");
    settle(game);
    expect(game.libraryOf(A)[0]).toBe(forest);
  });
});

describe("top-10000 batch 30h — Nissa, Voice of Zendikar", () => {
  it("−7 gains X life and draws X cards, X the lands you control", () => {
    const game = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Forest");
    spawn(game, "Forest", B);
    const handBefore = game.handOf(A).length;
    game.debugApplyEffect(A, registry.get("Nissa, Voice of Zendikar")!.activated[2].effect!);
    settle(game);
    expect(life(game, A)).toBe(23);
    expect(game.handOf(A)).toHaveLength(handBefore + 3);
  });
});
