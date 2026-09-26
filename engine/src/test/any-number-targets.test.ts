/**
 * "Any number of target …" (rule 601.2c) — the `any-number` target spec: a
 * group that is the last slot of its list, filled with as many distinct
 * targets as the player picks (none included), checked against specs of its
 * own shape (`concreteTargetSpecs`) at the cast and again as it resolves.
 * Effects reach the members through `for-each-target` or a flicker's
 * `{ from }` slot list.
 *
 * Cards: Eerie Interlude, Brago, King Eternal, Divine Resilience, Mindbreak
 * Trap, Court of Cunning, Riverchurn Monument, Singularity Rupture, Deepglow
 * Skate and Stonespeaker Crystal. Also here: an "up to one" slot with
 * nothing to point at no longer removes a triggered ability (rule 603.3d).
 */

import { describe, expect, it } from "vitest";

import { BUILTIN_CARDS } from "../cards/generated.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import type { GameRules } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { targetCombos } from "../decisions/shared/target-combos.js";
import { anyNumberSlot, concreteTargetSpecs, slotOptions } from "../target.js";
import type { TargetRef, TargetSpec } from "../target.js";
import { invalidTargetReason } from "../targeting.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const setUp = (players: readonly PlayerId[] = [A, B], rules: Partial<GameRules> = { maxLandsPerTurn: 99 }) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)])) as Record<
    PlayerId,
    ScriptedController
  >;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxHandSize: 99, ...rules },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Wastes") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.debugApplyEffect(player, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: card }]);
  return card;
};
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const graveyard = (game: Game, p: PlayerId): number => game.state.zones.perPlayer[p].graveyard.length;
const library = (game: Game, p: PlayerId): number => game.state.zones.perPlayer[p].library.length;

describe("concreteTargetSpecs", () => {
  const specs: TargetSpec[] = ["player", { kind: "any-number", of: "creature" }];

  it("expands the group into one slot per member, each after the first distinct from those before", () => {
    expect(anyNumberSlot(specs)).toBe(1);
    expect(concreteTargetSpecs(specs, 1)).toEqual(["player"]);
    expect(concreteTargetSpecs(specs, 3)).toEqual([
      "player",
      "creature",
      { kind: "other", of: "creature", than: { slots: [1] } },
    ]);
  });

  it("offers a group's pick only what the group hasn't already named", () => {
    const options = [[player(B)], [obj("x" as ObjectId), obj("y" as ObjectId)]];
    expect(slotOptions(specs, options, 1, [player(B)])).toEqual([obj("x" as ObjectId), obj("y" as ObjectId)]);
    expect(slotOptions(specs, options, 2, [player(B), obj("x" as ObjectId)])).toEqual([obj("y" as ObjectId)]);
    expect(slotOptions(specs, options, 3, [player(B), obj("x" as ObjectId), obj("y" as ObjectId)])).toEqual([]);
  });

  it("gives a bot none, each candidate alone, and all of them", () => {
    const group: TargetSpec[] = [{ kind: "any-number", of: "player" }];
    expect(targetCombos([[player(A), player(B)]], 10, group)).toEqual([
      [],
      [player(A)],
      [player(B)],
      [player(A), player(B)],
    ]);
  });

  it("leaves a list without a group alone", () => {
    const plain: TargetSpec[] = ["creature", "player"];
    expect(anyNumberSlot(plain)).toBe(-1);
    expect(concreteTargetSpecs(plain, 5)).toBe(plain);
  });

  it("judges a choice against specs of its own shape: none is fine, a repeat or an illegal member isn't", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const other = spawn(game, "Grizzly Bears", B);
    const island = spawn(game, "Island");
    const check = (chosen: readonly TargetRef[]) =>
      invalidTargetReason(game.state, registry, specs, chosen, A, "test");
    expect(check([player(B)])).toBeNull();
    expect(check([player(B), obj(bears), obj(other)])).toBeNull();
    expect(check([player(B), obj(bears), obj(bears)])).toMatch(/another than/);
    expect(check([player(B), obj(island)])).toMatch(/illegal target/);
    // The fixed slot before the group still has to be filled.
    expect(check([])).toMatch(/takes 1 target/);
  });
});

describe("Eerie Interlude", () => {
  it("exiles any number of your creatures and returns them together at the next end step", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    const theirs = spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 3; i += 1) spawn(game, "Plains");
    const interlude = game.debugSpawn("Eerie Interlude", A, "hand");
    const offer = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === interlude);
    if (offer?.kind !== "cast-spell") throw new Error("not offered");
    // One slot, the group, offering only your creatures.
    expect(offer.targetSpecs).toEqual([{ kind: "any-number", of: "creature-you-control" }]);
    expect(offer.targetOptions[0]).toEqual(expect.arrayContaining([obj(bears), obj(elves)]));
    expect(offer.targetOptions[0]).not.toContainEqual(obj(theirs));
    game.dispatch({ type: "cast-spell", player: A, card: interlude, targets: [obj(bears), obj(elves)] });
    game.advanceUntil(quiet);
    expect([zoneOf(game, bears), zoneOf(game, elves)]).toEqual(["exile", "exile"]);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect([zoneOf(game, bears), zoneOf(game, elves)]).toEqual(["battlefield", "battlefield"]);
    expect(zoneOf(game, theirs)).toBe("battlefield");
  });

  it("can be cast with no targets at all, and does nothing", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    for (let i = 0; i < 3; i += 1) spawn(game, "Plains");
    const interlude = game.debugSpawn("Eerie Interlude", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: interlude, targets: [] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, interlude)).toBe("graveyard");
    expect(zoneOf(game, bears)).toBe("battlefield");
  });

  it("refuses the same creature twice and a creature you don't control", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 3; i += 1) spawn(game, "Plains");
    const interlude = game.debugSpawn("Eerie Interlude", A, "hand");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: interlude, targets: [obj(bears), obj(bears)] }),
    ).toThrow();
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: interlude, targets: [obj(theirs)] }),
    ).toThrow();
  });

  it("fizzles only if every chosen target has become illegal; one left still returns", () => {
    const run = (killBoth: boolean) => {
      const { game } = setUp();
      const bears = spawn(game, "Grizzly Bears");
      const elves = spawn(game, "Llanowar Elves");
      for (let i = 0; i < 3; i += 1) spawn(game, "Plains");
      const interlude = game.debugSpawn("Eerie Interlude", A, "hand");
      game.dispatch({ type: "cast-spell", player: A, card: interlude, targets: [obj(bears), obj(elves)] });
      // In response, the targets die.
      game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(bears)]);
      if (killBoth) game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(elves)]);
      game.advanceUntil(quiet);
      return { game, bears, elves, interlude };
    };
    const both = run(true);
    expect(both.game.state.eventLog.some((e) => e.type === "spell-fizzled" && e.object === both.interlude)).toBe(true);
    const one = run(false);
    expect(one.game.state.eventLog.some((e) => e.type === "spell-fizzled")).toBe(false);
    expect(zoneOf(one.game, one.elves)).toBe("exile");
  });
});

describe("Mindbreak Trap", () => {
  it("exiles any number of target spells — one that can't be countered too", () => {
    const { game } = setUp();
    for (let i = 0; i < 4; i += 1) spawn(game, "Island", B);
    spawn(game, "Swamp");
    spawn(game, "Forest");
    spawn(game, "Island");
    const ring = spawn(game, "Sol Ring", B);
    const decay = game.debugSpawn("Abrupt Decay", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: decay, targets: [obj(ring)] });
    const opt = game.debugSpawn("Opt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: opt });
    game.advanceUntil((s) => s.priority.holder === B);
    const trap = game.debugSpawn("Mindbreak Trap", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: trap, targets: [obj(decay), obj(opt)] });
    game.advanceUntil(quiet);
    expect([zoneOf(game, decay), zoneOf(game, opt)]).toEqual(["exile", "exile"]);
    expect(zoneOf(game, ring)).toBe("battlefield");
  });

  it("is free once an opponent has cast three spells this turn", () => {
    const { game } = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    const cast = () => {
      game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Ornithopter", A, "hand") });
      game.advanceUntil(quiet);
    };
    const trap = game.debugSpawn("Mindbreak Trap", B, "hand");
    const free = () =>
      game.legalActions(B).some((a) => a.kind === "cast-spell" && a.card === trap && a.free === true);
    cast();
    cast();
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Ornithopter", A, "hand") });
    game.advanceUntil((s) => s.priority.holder === B);
    expect(free()).toBe(true);
  });
});

describe("Court of Cunning", () => {
  it("makes you the monarch; your upkeep mills any number of target players ten each", () => {
    const { game, c } = setUp();
    enter(game, "Court of Cunning");
    game.advanceUntil(quiet);
    expect(game.state.monarch).toBe(A);
    let offered: readonly (readonly TargetRef[])[] = [];
    c[A].chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options;
      return [player(B), player(A)];
    };
    const [a, b] = [library(game, A), library(game, B)];
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(offered[0]).toEqual(expect.arrayContaining([player(A), player(B)]));
    // Bob's draw step and the monarch's end-step card came out of the
    // libraries too.
    expect(graveyard(game, B)).toBe(10);
    expect(graveyard(game, A)).toBe(10);
    expect(library(game, B)).toBe(b - 10 - 1);
    expect(library(game, A)).toBeLessThan(a - 10);
  });

  it("with none chosen, mills nobody", () => {
    const { game, c } = setUp();
    enter(game, "Court of Cunning");
    game.advanceUntil(quiet);
    c[A].chooseTargetsFn = () => [];
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(graveyard(game, A)).toBe(0);
    expect(graveyard(game, B)).toBe(0);
  });
});

describe("Riverchurn Monument", () => {
  it("mills each chosen player two; its exhaust mills each as many as they have in their graveyard", () => {
    const { game } = setUp([A, B, C]);
    const monument = spawn(game, "Riverchurn Monument");
    for (let i = 0; i < 6; i += 1) spawn(game, "Island");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: monument,
      abilityIndex: 0,
      targets: [player(B), player(C)],
    });
    game.advanceUntil(quiet);
    expect([graveyard(game, A), graveyard(game, B), graveyard(game, C)]).toEqual([0, 2, 2]);
    game.state.objects[monument].tapped = false;
    game.debugSpawn("Wastes", B, "graveyard");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: monument,
      abilityIndex: 1,
      targets: [player(B), player(C)],
    });
    game.advanceUntil(quiet);
    expect([graveyard(game, B), graveyard(game, C)]).toEqual([6, 4]);
  });
});

describe("Singularity Rupture", () => {
  it("destroys every creature, then each target player mills half their library, rounded down", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 5; i += 1) spawn(game, "Swamp");
    spawn(game, "Island");
    // An odd count, so rounding down is seen: 33 mills 16, not 17.
    const before = library(game, B);
    expect(before % 2).toBe(1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Singularity Rupture", A, "hand"),
      targets: [player(B)],
    });
    game.advanceUntil(quiet);
    expect([zoneOf(game, bears), zoneOf(game, theirs)]).toEqual(["graveyard", "graveyard"]);
    expect(library(game, B)).toBe(before - Math.floor(before / 2));
    expect(library(game, A)).toBeGreaterThan(30);
  });
});

describe("Deepglow Skate", () => {
  it("doubles each kind of counter on any number of target permanents", () => {
    const { game, c } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].counters["+1/+1"] = 2;
    game.state.objects[bears].counters.charge = 1;
    game.state.objects[theirs].counters["+1/+1"] = 3;
    c[A].chooseTargetsFn = () => [obj(bears)];
    enter(game, "Deepglow Skate");
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(4);
    expect(game.state.objects[bears].counters.charge).toBe(2);
    expect(game.state.objects[theirs].counters["+1/+1"]).toBe(3);
  });
});

describe("Stonespeaker Crystal", () => {
  it("exiles any number of target players' graveyards and draws", () => {
    const { game } = setUp([A, B, C]);
    const crystal = spawn(game, "Stonespeaker Crystal");
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    for (const p of [A, B, C]) game.debugSpawn("Grizzly Bears", p, "graveyard");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: crystal,
      abilityIndex: 1,
      targets: [player(B), player(C)],
    });
    game.advanceUntil(quiet);
    expect([graveyard(game, B), graveyard(game, C)]).toEqual([0, 0]);
    expect(graveyard(game, A)).toBe(2); // its own Bears and the Crystal
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
  });

  it("with no targets, just draws", () => {
    const { game } = setUp();
    const crystal = spawn(game, "Stonespeaker Crystal");
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "activate-ability", player: A, source: crystal, abilityIndex: 1, targets: [] });
    game.advanceUntil(quiet);
    expect(graveyard(game, B)).toBe(1);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
  });
});

describe("Divine Resilience", () => {
  it("one target unkicked; kicked, any number", () => {
    const { game } = setUp();
    const creatures = [spawn(game, "Grizzly Bears"), spawn(game, "Grizzly Bears"), spawn(game, "Llanowar Elves")];
    for (let i = 0; i < 4; i += 1) spawn(game, "Plains");
    const resilience = game.debugSpawn("Divine Resilience", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: resilience,
      kicked: true,
      targets: creatures.map(obj),
    });
    game.advanceUntil(quiet);
    expect(creatures.every((id) => game.characteristics(id).keywords.has("indestructible"))).toBe(true);
  });

  it("unkicked takes exactly one", () => {
    const { game } = setUp();
    const creatures = [spawn(game, "Grizzly Bears"), spawn(game, "Grizzly Bears")];
    spawn(game, "Plains");
    const resilience = game.debugSpawn("Divine Resilience", A, "hand");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: resilience, targets: creatures.map(obj) }),
    ).toThrow();
  });
});

describe("Brago, King Eternal", () => {
  it("combat damage to a player blinks any number of your nonland permanents, itself included", () => {
    const { game, c } = setUp();
    const brago = spawn(game, "Brago, King Eternal");
    const ring = spawn(game, "Sol Ring");
    game.state.objects[ring].tapped = true;
    const land = spawn(game, "Plains");
    let offered: readonly (readonly TargetRef[])[] = [];
    c[A].declareAttackersFn = () => [{ attacker: brago, defender: B }];
    c[A].chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options;
      return [obj(brago), obj(ring)];
    };
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(offered[0]).toEqual(expect.arrayContaining([obj(brago), obj(ring)]));
    expect(offered[0]).not.toContainEqual(obj(land));
    // Blinked: back untapped, as new objects.
    expect(zoneOf(game, ring)).toBe("battlefield");
    expect(game.state.objects[ring].tapped).toBe(false);
    expect(game.state.objects[brago].tapped).toBe(false);
  });
});

describe("rule 603.3d: an optional slot with nothing to point at", () => {
  it("doesn't remove the trigger — Betor's counters land though no creature card is in the graveyard", () => {
    const { game } = setUp();
    spawn(game, "Betor, Ancestor's Voice");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(3);
  });
});

describe("an any-number group", () => {
  it("is always the last slot of its list, never in a modal spell's mode", () => {
    const misplaced: string[] = [];
    const lists = (name: string, specs: readonly TargetSpec[] | undefined) => {
      if (specs === undefined) return;
      const at = specs.findIndex((s) => typeof s === "object" && s.kind === "any-number");
      const count = specs.filter((s) => typeof s === "object" && s.kind === "any-number").length;
      if (count > 1 || (at >= 0 && at !== specs.length - 1)) misplaced.push(name);
    };
    for (const def of BUILTIN_CARDS) {
      lists(def.name, def.targets);
      lists(`${def.name} (kicked)`, def.kicker?.targets);
      for (const ability of def.activated) lists(`${def.name} (activated)`, ability.targets);
      for (const ability of def.triggered) lists(`${def.name} (triggered)`, ability.targets);
      for (const mode of def.castModal?.modes ?? []) {
        if ((mode.targets ?? []).some((s) => typeof s === "object" && s.kind === "any-number")) {
          misplaced.push(`${def.name} (mode)`);
        }
      }
    }
    expect(misplaced).toEqual([]);
  });
});
