/**
 * Top-5000 batch 21f. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — a search to the top of the library
 * (Elvish Harbinger), the X ≥ 10 half (Finale of Glory), a graveyard target
 * capped by life gained this turn (Celestine), a count of Gates (Basilisk
 * Gate), the Corrupted gate on a mana ability (Glistening Sphere), "other
 * artifact creatures" (Chief of the Foundry), the two equip costs and the
 * base 7/7 (Wrecking Ball Arm), mana value plus one (Oswald Fiddlebender),
 * and both draws (Flumph).
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const countNamed = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power!, c.toughness!];
};
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
const canActivate = (game: Game, source: ObjectId, abilityIndex: number): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === abilityIndex);

describe("top-5000 batch 21f — Elvish Harbinger", () => {
  it("finds an Elf and leaves it on top of the library", () => {
    const { game } = setUp();
    const elf = game.debugSpawn("Llanowar Elves", A, "library");
    game.debugSpawn("Wastes", A, "library");
    expect(game.state.zones.perPlayer[A].library[0]).not.toBe(elf);
    game.debugSpawn("Elvish Harbinger", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(elf);
  });
});

describe("top-5000 batch 21f — Finale of Glory", () => {
  it("makes only Soldiers below 10, and as many Angels too at 10", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, effectOf("Finale of Glory"), [], { x: 3 });
    settle(game);
    expect(countNamed(game, "Soldier Token (Finale of Glory)")).toBe(3);
    expect(countNamed(game, "4/4 Vigilant Angel Token")).toBe(0);
    game.debugApplyEffect(A, effectOf("Finale of Glory"), [], { x: 10 });
    settle(game);
    expect(countNamed(game, "Soldier Token (Finale of Glory)")).toBe(13);
    expect(countNamed(game, "4/4 Vigilant Angel Token")).toBe(10);
  });
});

describe("top-5000 batch 21f — Celestine, the Living Saint", () => {
  it("returns a creature card with mana value up to the life gained this turn", () => {
    const { game } = setUp();
    spawn(game, "Celestine, the Living Saint");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 }, []);
    game.advanceUntil((s) => s.turn.step === "end" || s.result.over);
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, giant)).toBe("graveyard");
  });
});

describe("top-5000 batch 21f — Basilisk Gate", () => {
  it("pumps a creature by the number of Gates you control", () => {
    const { game } = setUp();
    const gate = spawn(game, "Basilisk Gate");
    spawn(game, "Azorius Guildgate");
    spawn(game, "Azorius Guildgate", B);
    lands(game, "Wastes", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: gate,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(pt(game, bears)).toEqual([4, 4]);
  });
});

describe("top-5000 batch 21f — Glistening Sphere", () => {
  it("makes three only while an opponent has three poison counters", () => {
    const { game } = setUp();
    const sphere = spawn(game, "Glistening Sphere");
    game.state.objects[sphere].tapped = false; // it enters tapped
    expect(canActivate(game, sphere, 0)).toBe(true);
    expect(canActivate(game, sphere, 1)).toBe(false);
    game.state.players[B].counters.poison = 2;
    expect(canActivate(game, sphere, 1)).toBe(false);
    game.state.players[B].counters.poison = 3;
    expect(canActivate(game, sphere, 1)).toBe(true);
  });
});

describe("top-5000 batch 21f — Chief of the Foundry", () => {
  it("pumps other artifact creatures you control only", () => {
    const { game } = setUp();
    const chief = spawn(game, "Chief of the Foundry");
    const thopter = spawn(game, "Ornithopter");
    const theirs = spawn(game, "Ornithopter", B);
    const bears = spawn(game, "Grizzly Bears");
    expect(pt(game, chief)).toEqual([2, 3]);
    expect(pt(game, thopter)).toEqual([1, 3]);
    expect(pt(game, theirs)).toEqual([0, 2]);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("top-5000 batch 21f — Wrecking Ball Arm", () => {
  it("equips a legendary creature for {3} and makes it a base 7/7", () => {
    const { game } = setUp();
    const arm = spawn(game, "Wrecking Ball Arm");
    lands(game, "Wastes", 3);
    const bears = spawn(game, "Grizzly Bears");
    const oswald = spawn(game, "Oswald Fiddlebender");
    expect(canActivate(game, arm, 0)).toBe(true);
    game.state.objects[oswald].counters = { "+1/+1": 1 };
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: arm,
      abilityIndex: 0,
      targets: [{ kind: "object", object: oswald }],
    });
    settle(game);
    expect(pt(game, oswald)).toEqual([8, 8]);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("top-5000 batch 21f — Oswald Fiddlebender", () => {
  it("finds an artifact with mana value one more than the one sacrificed", () => {
    const { game } = setUp();
    const oswald = spawn(game, "Oswald Fiddlebender");
    spawn(game, "Plains");
    const ring = spawn(game, "Sol Ring");
    const stone = game.debugSpawn("Mind Stone", A, "library");
    const thopter = game.debugSpawn("Ornithopter", A, "library");
    game.dispatch({ type: "activate-ability", player: A, source: oswald, abilityIndex: 0, targets: [], sacrifice: ring });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
    expect(zone(game, stone)).toBe("battlefield");
    expect(zone(game, thopter)).toBe("library");
  });
});

describe("top-5000 batch 21f — Flumph", () => {
  it("draws a card for you and the target opponent when it's dealt damage", () => {
    const { game } = setUp();
    const flumph = spawn(game, "Flumph");
    const handA = game.handOf(A).length;
    const handB = game.handOf(B).length;
    const shooter = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [{ kind: "object", object: flumph }], {
      source: shooter,
    });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handA + 1);
    expect(game.handOf(B)).toHaveLength(handB + 1);
  });
});
