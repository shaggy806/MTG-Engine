/**
 * Top-10000 batch 34f. Pins the clause of each authored card most likely to
 * be wired wrong: Exude Toxin's -X/-X sparing Dragons (and the omen going
 * back into the library); Sanctum of Tranquil Light's cost dropping per
 * Shrine; Boseiju Reaches Skyward's chapter II and its flip to a Branch that
 * counts lands; Aberrant Return reanimating from any graveyard with a -1/-1
 * counter each; Bighorner Rancher's greatest-power mana and greatest *other*
 * toughness life; Make Your Move's "power 4 or greater" binding only
 * creatures; Agent Venom ignoring tokens; Primal Beyond entering tapped
 * without an Elemental to reveal.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef, TargetSpec } from "../target.js";
import { legalTargets } from "../targeting.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = []): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  a.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const settle = (game: Game): void => {
  game.advanceUntil(quiet);
};

describe("top-10000 batch 34f — Exude Toxin", () => {
  it("gives each non-Dragon creature -X/-X, spares Dragons, and shuffles the card away", () => {
    const { game } = setUp(["Scavenger Regent"]);
    lands(game, "Swamp", 4);
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const dragon = spawn(game, "Shivan Dragon", B);
    const card = inHand(game, "Scavenger Regent");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], face: 1, xValue: 2 });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.characteristics(giant).power).toBe(1);
    expect(game.characteristics(giant).toughness).toBe(1);
    expect(game.characteristics(dragon).power).toBe(5);
    expect(game.characteristics(dragon).toughness).toBe(5);
    // An Omen resolving goes into the library, not the graveyard (rule 720.3d).
    const regentInLibrary = game.state.zones.perPlayer[A].library.some(
      (id) => game.state.objects[id]?.cardName === "Scavenger Regent",
    );
    expect(regentInLibrary).toBe(true);
    expect(game.state.zones.perPlayer[A].graveyard.some((id) => game.state.objects[id]?.cardName === "Scavenger Regent")).toBe(false);
  });
});

describe("top-10000 batch 34f — Sanctum of Tranquil Light", () => {
  it("costs {1} less for each Shrine you control, itself included", () => {
    const { game } = setUp();
    const sanctum = spawn(game, "Sanctum of Tranquil Light");
    lands(game, "Plains", 4);
    const bears = spawn(game, "Grizzly Bears", B);
    const canTap = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === sanctum && x.abilityIndex === 0);
    // One Shrine: {4}{W}, and only four lands.
    expect(canTap()).toBe(false);
    spawn(game, "Honden of Cleansing Fire");
    // Two Shrines: {3}{W}.
    expect(canTap()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: sanctum, abilityIndex: 0, targets: [obj(bears)] });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(true);
  });
});

describe("top-10000 batch 34f — Boseiju Reaches Skyward", () => {
  it("II puts a land card from your graveyard on top; III returns it as a Branch counting lands", () => {
    const { game } = setUp();
    const saga = spawn(game, "Boseiju Reaches Skyward");
    settle(game);
    const forest = game.debugSpawn("Forest", A, "graveyard");
    const chapters = registry.get("Boseiju Reaches Skyward")!.chapters!;
    game.debugApplyEffect(A, chapters[1].effect!, [obj(forest)], { source: saga });
    settle(game);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(forest);

    lands(game, "Forest", 3);
    game.debugApplyEffect(A, chapters[2].effect!, [], { source: saga });
    settle(game);
    const [branch] = named(game, "Boseiju Reaches Skyward");
    expect(branch).toBeDefined();
    expect(game.state.objects[branch].face).toBe(1);
    expect(game.state.objects[branch].controller).toBe(A);
    expect(game.characteristics(branch).power).toBe(3);
    expect(game.characteristics(branch).toughness).toBe(3);
    expect(game.characteristics(branch).keywords.has("reach")).toBe(true);
  });
});

describe("top-10000 batch 34f — Aberrant Return", () => {
  it("puts creature cards from any graveyards onto the battlefield under your control, each with a -1/-1 counter", () => {
    const { game } = setUp(["Aberrant Return"]);
    lands(game, "Swamp", 6);
    const bears = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const elves = game.debugSpawn("Llanowar Elves", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", B, "graveyard");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Aberrant Return"),
      targets: [obj(bears), obj(elves), obj(giant)],
    });
    settle(game);
    const [newBears] = named(game, "Grizzly Bears");
    const [newGiant] = named(game, "Hill Giant");
    expect(game.state.objects[newBears].controller).toBe(A);
    expect(game.state.objects[newGiant].controller).toBe(A);
    expect(game.state.objects[newBears].counters?.["-1/-1"]).toBe(1);
    expect(game.characteristics(newBears).power).toBe(1);
    expect(game.characteristics(newGiant).toughness).toBe(2);
    // The 1/1 Elves enter as 0/0 and die.
    expect(named(game, "Llanowar Elves")).toHaveLength(0);
    expect(
      game.state.zones.perPlayer[A].graveyard.some((id) => game.state.objects[id]?.cardName === "Llanowar Elves"),
    ).toBe(true);
  });

  it("can take a single target", () => {
    const { game } = setUp(["Aberrant Return"]);
    lands(game, "Swamp", 6);
    const giant = game.debugSpawn("Hill Giant", B, "graveyard");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Aberrant Return"),
      targets: [obj(giant), null, null],
    });
    settle(game);
    expect(named(game, "Hill Giant")).toHaveLength(1);
  });
});

describe("top-10000 batch 34f — Bighorner Rancher", () => {
  it("adds G equal to the greatest power, and gains the greatest toughness among the others", () => {
    const { game } = setUp();
    const rancher = spawn(game, "Bighorner Rancher");
    spawn(game, "Hill Giant");
    game.dispatch({ type: "activate-ability", player: A, source: rancher, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G", "G", "G"]);
    game.dispatch({ type: "activate-ability", player: A, source: rancher, abilityIndex: 1 });
    settle(game);
    // Hill Giant's 3, not the Rancher's own 5.
    expect(life(game, A)).toBe(23);
  });
});

describe("top-10000 batch 34f — Make Your Move", () => {
  it("targets any artifact or enchantment, but only creatures with power 4 or greater", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const dragon = spawn(game, "Shivan Dragon", B);
    const ring = spawn(game, "Sol Ring", B);
    const spec: TargetSpec = registry.get("Make Your Move")!.targets[0];
    const options = legalTargets(game.state, registry, spec, A);
    expect(options).toContainEqual(obj(dragon));
    expect(options).toContainEqual(obj(ring));
    expect(options).not.toContainEqual(obj(bears));
    expect(options).not.toContainEqual(obj(giant));
  });
});

describe("top-10000 batch 34f — Agent Venom", () => {
  it("draws and drains for another nontoken creature, not a token", () => {
    const { game } = setUp();
    spawn(game, "Agent Venom");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 }, []);
    settle(game);
    const [soldier] = named(game, "Soldier Token");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(soldier)]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand);
    expect(life(game, A)).toBe(20);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    expect(life(game, A)).toBe(19);
  });
});

describe("top-10000 batch 34f — Primal Beyond", () => {
  it("enters tapped with no Elemental card to reveal", () => {
    const { game } = setUp(["Primal Beyond"]);
    const card = inHand(game, "Primal Beyond");
    game.dispatch({ type: "play-land", player: A, card });
    settle(game);
    expect(zone(game, card)).toBe("battlefield");
    expect(game.state.objects[card].tapped).toBe(true);
  });
});
