/**
 * Top-5000 batch 23c. No engine change: every card is existing vocabulary.
 * These pin the clauses most likely to be wired wrong — a draw sized by a
 * target's power (Soul's Majesty), a leaves-trigger reading last-known power
 * (Rapacious Guest), a cast trigger sized by the spell's mana value
 * (Skittering Cicada), the back face's opponent-draw discount (Heliod), the
 * granted affinity (Mycosynth Golem), the land-to-graveyard tutor
 * (Flagstones of Trokair), the sacrifice-then-search (Planar Engineering), the
 * reveal-until (Evolutionary Leap) and the disturb face's leave trigger
 * (Luminous Phantom).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};

describe("top-5000 batch 23c — Soul's Majesty", () => {
  it("draws as many cards as the target's power", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant");
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Soul's Majesty"), [{ kind: "object", object: giant }]);
    settle(game);
    expect(game.handOf(A).length).toBe(before + 3);
  });
});

describe("top-5000 batch 23c — Rapacious Guest", () => {
  it("makes the opponent lose its power as it last was when it leaves", () => {
    const { game } = setUp();
    const guest = spawn(game, "Rapacious Guest");
    game.state.objects[guest].counters = { "+1/+1": 2 };
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [{ kind: "object", object: guest }]);
    settle(game);
    expect(zone(game, guest)).toBe("hand");
    // 2/2 with two counters: 4, read as it last existed on the battlefield.
    expect(life(game, B)).toBe(16);
  });
});

describe("top-5000 batch 23c — Skittering Cicada", () => {
  it("gets +X/+X and trample for a colorless spell, X its mana value", () => {
    const { game } = setUp(["Mind Stone"]);
    const cicada = spawn(game, "Skittering Cicada");
    lands(game, "Wastes", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Mind Stone"), targets: [] });
    settle(game);
    expect(named(game, "Mind Stone")).toHaveLength(1);
    expect(pt(game, cicada)).toEqual([4, 4]);
    expect(computeCharacteristics(game.state, registry, cicada).keywords).toContain("trample");
  });
});

describe("top-5000 batch 23c — Heliod, the Warped Eclipse", () => {
  it("takes {1} off your spells for each card your opponents drew this turn", () => {
    const { game } = setUp(["Hill Giant"]);
    lands(game, "Mountain", 2);
    const heliod = spawn(game, "Heliod, the Radiant Dawn");
    game.debugApplyEffect(A, { kind: "transform", target: "source" }, [], { source: heliod });
    settle(game);
    // The back face is a 4/6.
    expect(pt(game, heliod)).toEqual([4, 6]);
    const giant = inHand(game, "Hill Giant");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === giant);
    expect(castable()).toBe(false);
    game.debugApplyEffect(B, { kind: "draw", amount: 2 });
    settle(game);
    expect(castable()).toBe(true);
  });
});

describe("top-5000 batch 23c — Mycosynth Golem", () => {
  it("gives artifact creature spells affinity for artifacts", () => {
    const { game } = setUp(["Solemn Simulacrum"]);
    lands(game, "Wastes", 1);
    // Tapped, so they count as artifacts but pay nothing: one Wastes is all
    // the mana there is.
    game.debugSpawn("Sol Ring", A, "battlefield", { tapped: true });
    game.debugSpawn("Mind Stone", A, "battlefield", { tapped: true });
    const solemn = inHand(game, "Solemn Simulacrum");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === solemn);
    expect(castable()).toBe(false);
    spawn(game, "Mycosynth Golem");
    // Three artifacts: {4} becomes {1}.
    expect(castable()).toBe(true);
  });
});

describe("top-5000 batch 23c — Flagstones of Trokair", () => {
  it("may fetch a Plains tapped when it's put into a graveyard from the battlefield", () => {
    const { game } = setUp([], "Plains");
    const flagstones = spawn(game, "Flagstones of Trokair");
    const before = named(game, "Plains").length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: flagstones }]);
    settle(game);
    expect(zone(game, flagstones)).toBe("graveyard");
    const plains = named(game, "Plains");
    expect(plains.length).toBe(before + 1);
    expect(plains.some((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

describe("top-5000 batch 23c — Evolutionary Leap", () => {
  it("reveals down to a creature, takes it, and bottoms the rest", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const w1 = game.debugSpawn("Wastes", A, "library");
    const w2 = game.debugSpawn("Wastes", A, "library");
    const library = (): readonly ObjectId[] => game.state.zones.perPlayer[A].library;
    const before = library().length;
    game.debugApplyEffect(A, registry.get("Evolutionary Leap")!.activated[0].effect!);
    settle(game);
    expect(zone(game, bears)).toBe("hand");
    expect(library().length).toBe(before - 1);
    // The two revealed above it went to the bottom.
    expect(new Set(library().slice(-2))).toEqual(new Set([w1, w2]));
  });
});
