/**
 * Top-10000 batch 33h. Existing vocabulary only; each test pins the clause
 * most likely to be wired wrong: Condescend's counter when X can't be paid,
 * Boundless Realms' X read off the lands you control, Radioactive Spider's
 * "Spider Hero" as both subtypes, Croaking Counterpart's 1/1 green Frog copy,
 * Byrke doubling only an attacker that has a +1/+1 counter, Pontiff of
 * Blight's printed extort plus one granted to each other creature, and Cosmic
 * Hunger biting a creature of your own.
 */
import { describe, expect, it } from "vitest";

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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;

describe("top-10000 batch 33h — Condescend", () => {
  it("counters a spell whose controller can't pay {X}", () => {
    const { game } = setUp(["Grizzly Bears", "Condescend"], "Island");
    lands(game, "Forest", 2);
    lands(game, "Island", 2);
    const bears = inHand(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    expect(zone(game, bears)).toBe("stack");
    const condescend = inHand(game, "Condescend");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: condescend,
      targets: [{ kind: "object", object: bears }],
      xValue: 1,
    });
    settle(game);
    // Every land is tapped, so the {1} can't be paid: the Bears are countered,
    // and Condescend resolved through to its scry.
    expect(named(game, "Grizzly Bears")).toHaveLength(0);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, condescend)).toBe("graveyard");
  });
});

describe("top-10000 batch 33h — Boundless Realms", () => {
  it("finds up to as many basic lands as you control lands, tapped", () => {
    const { game, a } = setUp([], "Forest");
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
    lands(game, "Forest", 3);
    game.debugApplyEffect(A, effectOf("Boundless Realms"));
    settle(game);
    const forests = named(game, "Forest");
    expect(forests).toHaveLength(6);
    expect(forests.filter((id) => game.state.objects[id].tapped)).toHaveLength(3);
  });
});

describe("top-10000 batch 33h — Radioactive Spider", () => {
  it("finds a card that is both a Spider and a Hero, not a Hero alone", () => {
    const { game } = setUp();
    const spider = spawn(game, "Radioactive Spider");
    lands(game, "Wastes", 2);
    const both = game.debugSpawn("Spectacular Spider-Man", A, "library");
    const heroOnly = game.debugSpawn("Amateur Hero", A, "library");
    game.dispatch({ type: "activate-ability", player: A, source: spider, abilityIndex: 0 });
    settle(game);
    expect(zone(game, spider)).toBe("graveyard");
    expect(zone(game, both)).toBe("hand");
    expect(zone(game, heroOnly)).toBe("library");
  });
});

describe("top-10000 batch 33h — Croaking Counterpart", () => {
  it("makes a copy that's a 1/1 green Frog, keeping the name", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, effectOf("Croaking Counterpart"), [{ kind: "object", object: giant }]);
    settle(game);
    const copy = named(game, "Hill Giant").find((id) => id !== giant)!;
    expect(copy).toBeDefined();
    expect(game.state.objects[copy].isToken).toBe(true);
    expect(game.state.objects[copy].controller).toBe(A);
    const c = game.characteristics(copy);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect([...c.colors]).toEqual(["G"]);
    expect(c.subtypes).toEqual(["Frog"]);
  });
});

describe("top-10000 batch 33h — Byrke, Long Ear of the Law", () => {
  it("doubles the +1/+1 counters of an attacker that has some, and leaves one without alone", () => {
    const { game } = setUp();
    spawn(game, "Byrke, Long Ear of the Law");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    game.state.objects[bears].counters = { "+1/+1": 2 };
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: bears, defender: B },
        { attacker: giant, defender: B },
      ],
    });
    settle(game);
    expect(counters(game, bears)).toBe(4);
    expect(counters(game, giant)).toBe(0);
  });
});

describe("top-10000 batch 33h — Pontiff of Blight", () => {
  it("extorts once for itself and once for each other creature you control", () => {
    const { game, a } = setUp();
    spawn(game, "Pontiff of Blight");
    spawn(game, "Grizzly Bears");
    spawn(game, "Island");
    lands(game, "Plains", 3);
    a.chooseModesFn = () => [0];
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Opt", A, "hand"), targets: [] });
    settle(game);
    // Two extorts with a third Plains spare: Pontiff's own instance once, the
    // Bears' granted one once.
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });
});

describe("top-10000 batch 33h — Cosmic Hunger", () => {
  it("has your creature deal its power to another creature, even one of yours, and take none back", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Cosmic Hunger"), [
      { kind: "object", object: giant },
      { kind: "object", object: bears },
    ]);
    expect(game.state.objects[bears].damageMarked).toBe(3);
    expect(game.state.objects[giant].damageMarked).toBe(0);
  });
});
