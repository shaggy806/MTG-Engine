/**
 * Top-5000 batch 29e. Each test pins the clause of its card most likely to be
 * wired wrong: Rakdos, the Muscle's exile counting the sacrificed creature's
 * mana value and letting any type of mana cast from it; Roil Cartographer's
 * energy; Glacier Godmaw's landfall reaching every creature; King Darien
 * XLVIII's tokens-only protection; Joint Exploration's kicked land drop;
 * Angelfire Ignition's five keywords; Cruel Somnophage's count and its
 * Adventure's mill.
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
const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
  theirLibrary = "Wastes",
): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill(theirLibrary) },
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
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);

describe("top-5000 batch 29e — Rakdos, the Muscle", () => {
  it("exiles the sacrificed creature's mana value from the target's library, castable with any type of mana", () => {
    const { game, a } = setUp([], "Wastes", "Grizzly Bears");
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    const rakdos = spawn(game, "Rakdos, the Muscle");
    const giant = spawn(game, "Hill Giant"); // mana value 4
    lands(game, "Plains", 2);
    const before = game.state.zones.perPlayer[B].library.length;
    game.dispatch({ type: "activate-ability", player: A, source: rakdos, abilityIndex: 0, sacrifice: giant });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(game.state.objects[rakdos].tapped).toBe(true);
    expect(chars(game, rakdos).keywords.has("indestructible")).toBe(true);
    expect(game.state.zones.perPlayer[B].library.length).toBe(before - 4);
    const exiled = Object.values(game.state.objects).filter(
      (o) => o.zone === "exile" && o.owner === B && o.cardName === "Grizzly Bears",
    );
    expect(exiled).toHaveLength(4);
    // {1}{G} paid with two Plains: "mana of any type can be spent".
    expect(
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === exiled[0].id),
    ).toBe(true);
    // Once each turn.
    const elves = spawn(game, "Llanowar Elves");
    expect(
      game
        .legalActions(A)
        .some((x) => x.kind === "activate-ability" && x.source === rakdos && x.abilityIndex === 0),
    ).toBe(false);
    expect(zone(game, elves)).toBe("battlefield");
  });
});

describe("top-5000 batch 29e — Roil Cartographer", () => {
  it("gets {E} on landfall and pays six for three cards", () => {
    const { game } = setUp(["Island"]);
    const roil = spawn(game, "Roil Cartographer");
    expect(game.state.players[A].energy).toBe(0);
    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Island") });
    settle(game);
    expect(game.state.players[A].energy).toBe(1);
    const canDraw = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === roil && x.abilityIndex === 0);
    expect(canDraw()).toBe(false);
    game.state.players[A].energy = 6;
    expect(canDraw()).toBe(true);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: roil, abilityIndex: 0 });
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 3);
    expect(game.state.players[A].energy).toBe(0);
  });
});

describe("top-5000 batch 29e — Glacier Godmaw", () => {
  it("landfall pumps every creature you control and gives vigilance and haste", () => {
    const { game } = setUp(["Forest"]);
    const godmaw = spawn(game, "Glacier Godmaw");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: true });
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Forest") });
    settle(game);
    const b = chars(game, bears);
    expect([b.power, b.toughness]).toEqual([3, 3]);
    expect(b.keywords.has("vigilance")).toBe(true);
    expect(b.keywords.has("haste")).toBe(true);
    expect(chars(game, godmaw).power).toBe(7);
    expect(chars(game, theirs).power).toBe(2);
  });
});

describe("top-5000 batch 29e — King Darien XLVIII", () => {
  it("grows and makes a Soldier, then shields only creature tokens", () => {
    const { game } = setUp();
    const darien = spawn(game, "King Darien XLVIII");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Wastes", 3);
    spawn(game, "Forest");
    spawn(game, "Plains");
    game.dispatch({ type: "activate-ability", player: A, source: darien, abilityIndex: 0 });
    settle(game);
    expect(counters(game, darien)).toBe(1);
    const soldiers = named(game, "Soldier Token");
    expect(soldiers).toHaveLength(1);
    expect(chars(game, soldiers[0]).power).toBe(2);
    game.dispatch({ type: "activate-ability", player: A, source: darien, abilityIndex: 1 });
    settle(game);
    expect(zone(game, darien)).toBe("graveyard");
    const soldier = named(game, "Soldier Token")[0];
    const s = chars(game, soldier);
    expect(s.keywords.has("hexproof")).toBe(true);
    expect(s.keywords.has("indestructible")).toBe(true);
    expect(s.power).toBe(1);
    expect(chars(game, bears).keywords.has("hexproof")).toBe(false);
  });
});

describe("top-5000 batch 29e — Joint Exploration", () => {
  it("puts a land from hand onto the battlefield only when kicked", () => {
    const { game } = setUp(["Joint Exploration", "Joint Exploration", "Forest"]);
    lands(game, "Island", 4);
    lands(game, "Forest", 2);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Joint Exploration"), targets: [] });
    settle(game);
    // Unkicked: scry 2 and draw — no land.
    expect(game.handOf(A).length).toBe(hand);
    expect(named(game, "Forest")).toHaveLength(2);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Joint Exploration"),
      targets: [],
      kicked: true,
    });
    settle(game);
    expect(named(game, "Forest")).toHaveLength(3);
    expect(game.handOf(A).some((id) => game.state.objects[id].cardName === "Forest")).toBe(false);
  });
});

describe("top-5000 batch 29e — Angelfire Ignition", () => {
  it("puts two counters on the creature and gives all five keywords", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Angelfire Ignition"), [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, bears)).toBe(2);
    const c = chars(game, bears);
    for (const k of ["vigilance", "trample", "lifelink", "indestructible", "haste"] as const) {
      expect(c.keywords.has(k)).toBe(true);
    }
  });
});

describe("top-5000 batch 29e — Cruel Somnophage // Can't Wake Up", () => {
  it("counts creature cards in every graveyard; the Adventure mills four", () => {
    const { game } = setUp([], "Grizzly Bears");
    const nightmare = spawn(game, "Cruel Somnophage");
    game.debugSpawn("Hill Giant", B, "graveyard");
    game.debugSpawn("Island", B, "graveyard");
    expect(chars(game, nightmare).power).toBe(1);
    game.debugApplyEffect(A, effectOf("Can't Wake Up"), [{ kind: "player", player: A }]);
    settle(game);
    const c = chars(game, nightmare);
    expect([c.power, c.toughness]).toEqual([5, 5]);
  });
});
