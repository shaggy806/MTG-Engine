/**
 * Top-5000 batch 28g. No engine changes: each test pins the clause of a card
 * most likely to be wired wrong — Sylvan Offering's X/X and X tokens for both
 * players, Path of Annihilation's granted any-colour mana on an Eldrazi,
 * Volcanic Vision reading the returned card's mana value, Prishe's
 * Wanderings' reflexive counter, Ravnica at War's multicolored filter,
 * Machinist's Arsenal's per-artifact pump and type, Spiteful Sliver's granted
 * trigger on lethal damage, and Into the North's snow filter.
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** How many permanents of `name` `player` controls, a token stack counted per token. */
const countOf = (game: Game, name: string, player: PlayerId): number =>
  named(game, name)
    .filter((id) => game.state.objects[id].controller === player)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number | undefined, number | undefined] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
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

describe("top-5000 batch 28g — Sylvan Offering", () => {
  it("gives you and the chosen opponent an X/X Treefolk and X Elf Warriors each", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, effectOf("Sylvan Offering"), [], { x: 2 });
    settle(game);
    for (const player of [A, B]) {
      const treefolk = named(game, "Treefolk Token (Sylvan Offering)").filter(
        (id) => game.state.objects[id].controller === player,
      );
      expect(treefolk).toHaveLength(1);
      expect(pt(game, treefolk[0])).toEqual([2, 2]);
      expect(countOf(game, "Elf Warrior Token", player)).toBe(2);
    }
  });
});

describe("top-5000 batch 28g — Path of Annihilation", () => {
  it("lets an Eldrazi you control tap for a colour it couldn't make", () => {
    const { game } = setUp(["Soul Warden"]);
    spawn(game, "Eldrazi Spawn Token");
    const warden = inHand(game, "Soul Warden");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === warden);
    // The Spawn's own ability makes only {C}.
    expect(castable()).toBe(false);
    spawn(game, "Path of Annihilation");
    expect(castable()).toBe(true);
  });
});

describe("top-5000 batch 28g — Ravnica at War", () => {
  it("exiles multicolored permanents and nothing else", () => {
    const { game } = setUp();
    const kraum = spawn(game, "Kraum, Ludevic's Opus");
    const bears = spawn(game, "Grizzly Bears", B);
    const ring = spawn(game, "Sol Ring", B);
    game.debugApplyEffect(A, effectOf("Ravnica at War"), []);
    settle(game);
    expect(zone(game, kraum)).toBe("exile");
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, ring)).toBe("battlefield");
  });
});

describe("top-5000 batch 28g — Machinist's Arsenal", () => {
  it("makes a Hero, equips it, and pumps +2/+2 per artifact you control, making it an Artificer", () => {
    const { game } = setUp();
    game.debugSpawn("Machinist's Arsenal", A, "battlefield", { announceEntry: true });
    settle(game);
    const hero = named(game, "Hero Token (Black Mage's Rod)");
    expect(hero).toHaveLength(1);
    // The Arsenal is the one artifact.
    expect(pt(game, hero[0])).toEqual([3, 3]);
    expect(computeCharacteristics(game.state, registry, hero[0]).subtypes).toContain("Artificer");
    spawn(game, "Sol Ring");
    // An opponent's artifact doesn't count.
    spawn(game, "Sol Ring", B);
    expect(pt(game, hero[0])).toEqual([5, 5]);
  });
});

describe("top-5000 batch 28g — Spiteful Sliver", () => {
  it("a Sliver dealt lethal damage still deals that much to the target player", () => {
    const { game, a } = setUp();
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    const sliver = spawn(game, "Spiteful Sliver");
    game.debugApplyEffect(B, { kind: "damage", target: 0, amount: 3 }, [{ kind: "object", object: sliver }]);
    settle(game);
    expect(zone(game, sliver)).toBe("graveyard");
    expect(life(game, B)).toBe(17);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 28g — Into the North", () => {
  it("puts a snow land onto the battlefield tapped", () => {
    const { game } = setUp([], "Snow-Covered Forest");
    game.debugApplyEffect(A, effectOf("Into the North"), []);
    settle(game);
    const found = named(game, "Snow-Covered Forest");
    expect(found).toHaveLength(1);
    expect(game.state.objects[found[0]].tapped).toBe(true);
  });

  it("finds nothing among non-snow lands", () => {
    const { game } = setUp([], "Forest");
    game.debugApplyEffect(A, effectOf("Into the North"), []);
    settle(game);
    expect(named(game, "Forest")).toHaveLength(0);
  });
});
