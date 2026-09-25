/**
 * "Two target …" is one instance of the word "target", so the same object
 * can be chosen for only one of its slots (rule 601.2c) — `distinctTargets`
 * and the `{ slots }` form of an `other` relation.
 */

import { describe, expect, it } from "vitest";

import { distinctTargets } from "../cards/helpers.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { targetCombos } from "../decisions/shared/target-combos.js";
import { Game } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { otherSlotConflict, slotOptions, targetsFillable } from "../target.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
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
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });

describe("Ghostly Flicker", () => {
  it("can't exile the same permanent for both targets", () => {
    const { game } = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    const bears = spawn(game, "Grizzly Bears");
    const flicker = game.debugSpawn("Ghostly Flicker", A, "hand");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: flicker, targets: [obj(bears), obj(bears)] }),
    ).toThrow(/another/);
    expect(game.state.objects[flicker].zone).toBe("hand");
  });

  it("flickers two different permanents: an artifact and a creature", () => {
    const { game } = setUp();
    const lands = [0, 1, 2].map(() => spawn(game, "Island"));
    const bears = spawn(game, "Grizzly Bears");
    const ring = spawn(game, "Sol Ring");
    const flicker = game.debugSpawn("Ghostly Flicker", A, "hand");
    const before = [bears, ring].map((id) => game.state.objects[id].zoneChangeCount ?? 0);
    game.dispatch({ type: "cast-spell", player: A, card: flicker, targets: [obj(bears), obj(ring)] });
    game.advanceUntil(quiet);
    [bears, ring].forEach((id, i) => {
      expect(game.state.objects[id].zone).toBe("battlefield");
      expect(game.state.objects[id].zoneChangeCount ?? 0).toBeGreaterThan(before[i]);
    });
    expect(lands.every((id) => game.state.objects[id].zone === "battlefield")).toBe(true);
  });

  it("isn't offered with only one permanent to target", () => {
    const { game } = setUp();
    const flicker = game.debugSpawn("Ghostly Flicker", A, "hand");
    // Paid from the pool, so no land is there to be a target.
    game.debugApplyEffect(A, { kind: "add-mana", mana: "U", amount: 3 }, []);
    const offered = () => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === flicker);
    spawn(game, "Grizzly Bears");
    expect(offered()).toBe(false);
    spawn(game, "Sol Ring");
    expect(offered()).toBe(true);
  });
});

describe("Garruk Wildspeaker's +1", () => {
  it("untaps two different lands, never one twice", () => {
    const { game } = setUp();
    const garruk = spawn(game, "Garruk Wildspeaker");
    const [one, two] = [spawn(game, "Forest"), spawn(game, "Forest")];
    game.state.objects[one].tapped = true;
    game.state.objects[two].tapped = true;
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: garruk, abilityIndex: 0, targets: [obj(one), obj(one)] }),
    ).toThrow(/another/);
    game.dispatch({ type: "activate-ability", player: A, source: garruk, abilityIndex: 0, targets: [obj(one), obj(two)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[one].tapped).toBe(false);
    expect(game.state.objects[two].tapped).toBe(false);
  });
});

describe("Rishkar, Peema Renegade", () => {
  it("its two counters go on two different creatures", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    a.chooseTargetsFn = () => [obj(bears), obj(bears)];
    game.debugSpawn("Rishkar, Peema Renegade", A, "battlefield", { announceEntry: true });
    expect(() => game.advanceUntil(quiet)).toThrow(/another/);
  });

  it("the default chooser picks two different creatures", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const rishkar = game.debugSpawn("Rishkar, Peema Renegade", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[rishkar].counters["+1/+1"]).toBe(1);
  });
});

describe("distinctTargets", () => {
  const [p, q, r] = ["p", "q", "r"].map((id) => obj(asObjectId(id)));

  it("makes every slot differ from the ones before it", () => {
    const specs = distinctTargets(3, "creature");
    expect(otherSlotConflict(specs, [p, q, r])).toBeNull();
    expect(otherSlotConflict(specs, [p, q, p])).toEqual({ slot: 2, than: 0 });
    expect(otherSlotConflict(specs, [p, q, q])).toEqual({ slot: 2, than: 1 });
    expect(slotOptions(specs, [[p, q, r], [p, q, r], [p, q, r]], 2, [p, q])).toEqual([r]);
    expect(targetsFillable(specs, [[p, q], [p, q], [p, q]])).toBe(false);
    expect(targetsFillable(specs, [[p, q, r], [p, q, r], [p, q, r]])).toBe(true);
  });

  it("\"up to\" slots may be skipped, and \"other targets\" differ from the first as well (Drakuseth)", () => {
    const specs = ["any-target" as const, ...distinctTargets(2, "any-target", { optional: true, from: 1, otherThan: [0] })];
    expect(otherSlotConflict(specs, [p, null, p])).toEqual({ slot: 2, than: 0 });
    expect(otherSlotConflict(specs, [p, q, q])).toEqual({ slot: 2, than: 1 });
    expect(otherSlotConflict(specs, [p, q, null])).toBeNull();
    expect(targetsFillable(specs, [[p], [p], [p]])).toBe(true);
  });

  it("a bot's capped combos are all distinct, and there are some (Lord Windgrace's six)", () => {
    const specs = distinctTargets(6, "nonland-permanent", { optional: true });
    const options = specs.map(() => [p, q, r]);
    const combos = targetCombos(options, 8, specs);
    expect(combos.length).toBeGreaterThan(0);
    for (const combo of combos) expect(otherSlotConflict(specs, combo)).toBeNull();
  });
});
