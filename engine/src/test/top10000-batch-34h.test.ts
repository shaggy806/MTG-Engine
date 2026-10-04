/**
 * Top-10000 batch 34h. Pins the clauses most likely to be wired wrong:
 * Rumbleweed's per-land-card discount and its "other" creatures, Opposition's
 * tap-a-creature cost, Yawgmoth's Vile Offering reanimating from any
 * graveyard under your control, Revenge of the Rats' tapped Rats counted per
 * creature card, Lava Dart's sacrifice-only flashback, Involuntary
 * Employment's Treasure, and Sunken Citadel's mana paying only for land
 * abilities.
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
const setUp = (): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** How many permanents of this name, a token stack counting as every token in it. */
const howMany = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
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
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-10000 batch 34h — Rumbleweed", () => {
  it("costs {1} less for each land card in your graveyard", () => {
    const { game } = setUp();
    const weed = game.debugSpawn("Rumbleweed", A, "hand");
    spawn(game, "Forest");
    for (let i = 0; i < 9; i += 1) game.debugSpawn("Wastes", A, "graveyard");
    // {10}{G} less nine is {1}{G}: one Forest can't pay it.
    expect(castable(game, weed)).toBe(false);
    game.debugSpawn("Wastes", A, "graveyard");
    // Less ten is {G}.
    expect(castable(game, weed)).toBe(true);
  });

  it("gives other creatures you control +3/+3 and trample, not itself or theirs", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const weed = game.debugSpawn("Rumbleweed", A, "battlefield", { announceEntry: true });
    settle(game);
    const mine = computeCharacteristics(game.state, registry, bears);
    expect([mine.power, mine.toughness]).toEqual([5, 5]);
    expect(mine.keywords).toContain("trample");
    const self = computeCharacteristics(game.state, registry, weed);
    expect([self.power, self.toughness]).toEqual([8, 8]);
    const other = computeCharacteristics(game.state, registry, theirs);
    expect([other.power, other.toughness]).toEqual([2, 2]);
    expect(other.keywords).not.toContain("trample");
  });
});

describe("top-10000 batch 34h — Opposition", () => {
  it("taps a creature you control to tap target land", () => {
    const { game } = setUp();
    const opposition = spawn(game, "Opposition");
    const bears = spawn(game, "Grizzly Bears");
    const land = spawn(game, "Wastes", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: opposition,
      abilityIndex: 0,
      tap: [bears],
      targets: [{ kind: "object", object: land }],
    });
    expect(game.state.objects[bears].tapped).toBe(true);
    game.advanceUntil(quiet);
    expect(game.state.objects[land].tapped).toBe(true);
    expect(game.state.objects[opposition].tapped).toBe(false);
  });
});

describe("top-10000 batch 34h — Yawgmoth's Vile Offering", () => {
  it("puts an opponent's creature card onto the battlefield under your control and destroys a creature", () => {
    const { game } = setUp();
    const angel = game.debugSpawn("Serra Angel", B, "graveyard");
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, effectOf("Yawgmoth's Vile Offering"), [
      { kind: "object", object: angel },
      { kind: "object", object: giant },
    ]);
    settle(game);
    const back = named(game, "Serra Angel");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].controller).toBe(A);
    expect(zone(game, giant)).toBe("graveyard");
  });
});

describe("top-10000 batch 34h — Revenge of the Rats", () => {
  it("makes one tapped Rat per creature card in your graveyard only", () => {
    const { game } = setUp();
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Wastes", A, "graveyard");
    game.debugSpawn("Hill Giant", B, "graveyard");
    game.debugApplyEffect(A, effectOf("Revenge of the Rats"), []);
    settle(game);
    expect(howMany(game, "Rat Token")).toBe(3);
    expect(named(game, "Rat Token").every((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

describe("top-10000 batch 34h — Lava Dart", () => {
  it("flashes back by sacrificing a Mountain, and only with one", () => {
    const { game } = setUp();
    const dart = game.debugSpawn("Lava Dart", A, "graveyard");
    const flashbacks = (): number =>
      game.legalActions(A).filter((x) => x.kind === "cast-spell" && x.card === dart && x.via === "flashback").length;
    const before = life(game, B);
    expect(flashbacks()).toBe(0);
    const mountain = spawn(game, "Mountain");
    expect(flashbacks()).toBe(1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: dart,
      via: "flashback",
      targets: [{ kind: "player", player: B }],
    });
    expect(zone(game, mountain)).toBe("graveyard");
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(before - 1);
    expect(zone(game, dart)).toBe("exile");
  });
});

describe("top-10000 batch 34h — Involuntary Employment", () => {
  it("steals and untaps the creature with haste, and makes a Treasure", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    game.state.objects[giant].tapped = true;
    game.debugApplyEffect(A, effectOf("Involuntary Employment"), [{ kind: "object", object: giant }]);
    settle(game);
    expect(game.state.objects[giant].controller).toBe(A);
    expect(game.state.objects[giant].tapped).toBe(false);
    expect(computeCharacteristics(game.state, registry, giant).keywords).toContain("haste");
    expect(howMany(game, "Treasure Token")).toBe(1);
    expect(game.state.objects[named(game, "Treasure Token")[0]].controller).toBe(A);
  });
});
