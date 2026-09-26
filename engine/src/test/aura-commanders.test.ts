/**
 * Commanders an entering Aura choosing what it enchants (rule 303.4f)
 * unblocked: each puts an enchantment or a permanent card onto the
 * battlefield without casting it. See `aura-entering.test.ts` for the rule.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const named = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);
const count = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const toStep = (game: Game, step: GameState["turn"]["step"]) =>
  game.advanceUntil((s) => s.turn.step === step && quiet(s));

describe("Zur the Enchanter", () => {
  it("attacking, it finds an enchantment of mana value 3 or less; an Aura chooses what it enchants", () => {
    const { game, a } = setUp();
    const zur = spawn(game, "Zur the Enchanter");
    const giant = spawn(game, "Hill Giant", B);
    const pacifism = game.debugSpawn("Pacifism", A, "library");
    a.declareAttackersFn = () => [{ attacker: zur, defender: B }];
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    let offered: readonly ObjectId[] = [];
    a.chooseEnchantFn = (_view, _source, options) => {
      offered = options;
      return giant;
    };
    toStep(game, "declare-blockers");
    // Not a target: Zur, attacking, could be enchanted as well.
    expect(offered).toEqual([zur, giant]);
    expect(game.state.objects[pacifism].zone).toBe("battlefield");
    expect(game.state.objects[pacifism].attachedTo).toBe(giant);
  });
});

describe("Go-Shintai of Life's Origin", () => {
  it("makes a Shrine as it enters, and as another nontoken Shrine does, but not as a Shrine token does", () => {
    const { game } = setUp();
    game.debugSpawn("Go-Shintai of Life's Origin", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(count(game, "Shrine Token")).toBe(1);
    // A second one: its own trigger, and the first one's for another Shrine.
    // The legend rule then keeps one of them.
    game.debugSpawn("Go-Shintai of Life's Origin", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(named(game, "Go-Shintai of Life's Origin")).toHaveLength(1);
    expect(count(game, "Shrine Token")).toBe(3);
  });

  it("returns an enchantment card from your graveyard; an Aura chooses what it enchants", () => {
    const { game, a } = setUp();
    const shintai = spawn(game, "Go-Shintai of Life's Origin");
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) spawn(game, land);
    const giant = spawn(game, "Hill Giant", B);
    const pacifism = game.debugSpawn("Pacifism", A, "graveyard");
    a.chooseEnchantFn = () => giant;
    game.dispatch({ type: "activate-ability", player: A, source: shintai, abilityIndex: 0, targets: [obj(pacifism)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[pacifism].attachedTo).toBe(giant);
  });
});

describe("Kona, Rescue Beastie", () => {
  const withKona = (tapped: boolean) => {
    const { game, a } = setUp();
    const kona = spawn(game, "Kona, Rescue Beastie");
    game.state.objects[kona].tapped = tapped;
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    a.chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === giant);
    toStep(game, "postcombat-main");
    return { game, giant };
  };

  it("tapped as your second main phase begins, puts a permanent card from your hand onto the battlefield", () => {
    const { game, giant } = withKona(true);
    expect(game.state.objects[giant].zone).toBe("battlefield");
  });

  it("untapped, does nothing", () => {
    const { game, giant } = withKona(false);
    expect(game.state.objects[giant].zone).toBe("hand");
  });
});
