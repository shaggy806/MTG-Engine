/**
 * Top-5000 batch 24g. No engine change: every card here is existing
 * vocabulary. The tests pin the clause most likely to be wired wrong on each
 * — Arahbo's "itself or another nontoken Cat", Bladewing's pump of every
 * Dragon (not just yours), Dread Summons' count of creature cards put into
 * graveyards, Greenwarden's "exile it, if you do", MacCready's two attack
 * triggers, Memory Erosion's "that player", and Thirst for Discovery's
 * basic-land-only single discard.
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
const tokenCount = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
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

describe("top-5000 batch 24g — Arahbo, the First Fang", () => {
  it("makes a Cat for itself and for another nontoken Cat, not for a Cat token, and pumps other Cats", () => {
    const { game } = setUp();
    const arahbo = game.debugSpawn("Arahbo, the First Fang", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(tokenCount(game, "Cat Token (Arahbo, the First Fang)")).toBe(1);
    const lions = game.debugSpawn("Savannah Lions", A, "battlefield", { announceEntry: true });
    settle(game);
    // The Lions made one; the Cat tokens entering made none.
    expect(tokenCount(game, "Cat Token (Arahbo, the First Fang)")).toBe(2);
    // A non-Cat makes nothing.
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(tokenCount(game, "Cat Token (Arahbo, the First Fang)")).toBe(2);
    expect([chars(game, lions).power, chars(game, lions).toughness]).toEqual([3, 2]);
    expect([chars(game, arahbo).power, chars(game, arahbo).toughness]).toEqual([2, 2]);
    const token = named(game, "Cat Token (Arahbo, the First Fang)")[0];
    expect([chars(game, token).power, chars(game, token).toughness]).toEqual([2, 2]);
  });
});

describe("top-5000 batch 24g — Bladewing the Risen", () => {
  it("returns a Dragon from your graveyard, and pumps every Dragon creature, an opponent's too", () => {
    const { game, a } = setUp();
    const shivan = game.debugSpawn("Shivan Dragon", A, "graveyard");
    a.chooseTargetsFn = () => [{ kind: "object", object: shivan }];
    const bladewing = game.debugSpawn("Bladewing the Risen", A, "battlefield", { announceEntry: true });
    game.state.objects[bladewing].summoningSick = false;
    settle(game);
    expect(zone(game, shivan)).toBe("battlefield");
    const theirs = spawn(game, "Shivan Dragon", B);
    const bears = spawn(game, "Grizzly Bears", B);
    spawn(game, "Swamp");
    spawn(game, "Mountain");
    game.dispatch({ type: "activate-ability", player: A, source: bladewing, abilityIndex: 0 });
    settle(game);
    expect([chars(game, theirs).power, chars(game, theirs).toughness]).toEqual([6, 6]);
    expect([chars(game, bladewing).power, chars(game, bladewing).toughness]).toEqual([5, 5]);
    expect([chars(game, bears).power, chars(game, bears).toughness]).toEqual([2, 2]);
  });
});

describe("top-5000 batch 24g — Dread Summons", () => {
  it("makes a tapped Zombie for each creature card milled, from every library", () => {
    const { game } = setUp([], "Grizzly Bears");
    game.debugSpawn("Hill Giant", B, "library");
    game.debugApplyEffect(A, effectOf("Dread Summons"), [], { x: 3 });
    settle(game);
    // Three Bears from A's library, the Giant (and two Wastes) from B's.
    expect(tokenCount(game, "Zombie Token")).toBe(4);
    for (const id of named(game, "Zombie Token")) {
      expect(game.state.objects[id].controller).toBe(A);
      expect(game.state.objects[id].tapped).toBe(true);
    }
  });
});

describe("top-5000 batch 24g — Greenwarden of Murasa", () => {
  it("exiles itself as it dies to return a card from the graveyard", () => {
    const { game, a } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const warden = spawn(game, "Greenwarden of Murasa");
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: warden }]);
    settle(game);
    expect(zone(game, warden)).toBe("exile");
    expect(zone(game, bears)).toBe("hand");
  });
});

describe("top-5000 batch 24g — MacCready, Lamplight Mayor", () => {
  it("gives skulk only to an attacker of power 2 or less", () => {
    const { game, a } = setUp();
    spawn(game, "MacCready, Lamplight Mayor");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: giant, defender: B },
    ];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(chars(game, bears).keywords.has("skulk")).toBe(true);
    expect(chars(game, giant).keywords.has("skulk")).toBe(false);
  });

  it("drains the controller of a power-4-or-greater attacker, once per such attacker", () => {
    const { game, b } = setUp();
    spawn(game, "MacCready, Lamplight Mayor");
    const wurm = spawn(game, "Craw Wurm", B);
    const bears = spawn(game, "Grizzly Bears", B);
    b.declareAttackersFn = () => [
      { attacker: wurm, defender: A },
      { attacker: bears, defender: A },
    ];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main" && quiet(s));
    // Only the Wurm triggers: B loses 2; A gains 2 and takes 6 + 2 unblocked.
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(14);
  });
});

describe("top-5000 batch 24g — Memory Erosion", () => {
  it("mills the opponent who cast the spell", () => {
    const { game } = setUp(["Grizzly Bears"], "Forest");
    spawn(game, "Memory Erosion", B);
    lands(game, "Forest", 2);
    const libraryBefore = game.state.zones.perPlayer[A].library.length;
    const bLibraryBefore = game.state.zones.perPlayer[B].library.length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(game.state.zones.perPlayer[A].library.length).toBe(libraryBefore - 2);
    expect(game.state.zones.perPlayer[B].library.length).toBe(bLibraryBefore);
  });
});

describe("top-5000 batch 24g — Thirst for Discovery", () => {
  it("offers a single basic land card as the whole discard, never a nonbasic one", () => {
    const { game } = setUp(["Command Tower"], "Island");
    const tower = inHand(game, "Command Tower");
    game.debugApplyEffect(A, effectOf("Thirst for Discovery"), []);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("discard");
    if (awaiting?.kind !== "discard") return;
    expect(awaiting.orOneOf?.includes(tower)).toBe(false);
    const island = awaiting.orOneOf?.find((id) => game.state.objects[id].cardName === "Island");
    expect(island).toBeDefined();
    const before = game.handOf(A).length;
    game.dispatch({ type: "discard", player: A, cards: [island as ObjectId] });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(before - 1);
  });
});
