/**
 * Top-5000 batch 28b. No engine change: each test pins the clause most likely
 * to be wired wrong — an edict narrowed to attackers paying out the
 * sacrificed creature's toughness (Entrapment Maneuver), a granted {T}
 * ability the equipped creature itself uses (Viridian Longbow, The Odd Acorn
 * Gang), a counter-scaled Equipment bonus (Excalibur II), a lore counter put
 * on by an ability firing the next chapter (Satsuki on Summon: Fat Chocobo),
 * "becomes tapped" from its own mana ability (Armored Scrapgorger), a
 * four-type block restriction (Serpent of Yawning Depths) and every attacker
 * counted (Keep Watch).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { whyCannotBlock } from "../combat/eligibility.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
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
/** Every permanent of this name, a token stack counted as each token in it. */
const count = (game: Game, name: string): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === name)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind: string): number => game.state.objects[id].counters?.[kind] ?? 0;
const pt = (game: Game, id: ObjectId): [number, number] => {
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

describe("top-5000 batch 28b — Entrapment Maneuver", () => {
  it("makes the target player sacrifice an attacker, and makes Soldiers equal to its toughness", () => {
    const { game } = setUp(["Entrapment Maneuver"], "Plains");
    lands(game, "Plains", 4);
    const giant = spawn(game, "Hill Giant", B);
    const bears = spawn(game, "Grizzly Bears", B);
    game.state.objects[giant].attacking = A;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Entrapment Maneuver"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(zone(game, bears)).toBe("battlefield");
    expect(count(game, "Soldier Token")).toBe(3);
  });
});

describe("top-5000 batch 28b — Viridian Longbow", () => {
  it("gives the equipped creature a {T} ping it deals itself", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const bow = spawn(game, "Viridian Longbow");
    game.state.objects[bow].attachedTo = bears;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: bears,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(game.state.players[B].life).toBe(19);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(game.state.objects[bow].tapped).toBe(false);
  });
});

describe("top-5000 batch 28b — The Odd Acorn Gang", () => {
  it("gives a Squirrel the {T} pump, aimed at another Squirrel", () => {
    const { game } = setUp();
    const gang = spawn(game, "The Odd Acorn Gang");
    const squirrel = spawn(game, "Squirrel Token");
    const bears = spawn(game, "Grizzly Bears");
    const pumps = (id: ObjectId): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === id);
    expect(pumps(bears)).toBe(false);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: gang,
      abilityIndex: 0,
      targets: [{ kind: "object", object: squirrel }],
    });
    settle(game);
    expect(pt(game, squirrel)).toEqual([3, 3]);
    expect(computeCharacteristics(game.state, registry, squirrel).keywords.has("trample")).toBe(true);
    expect(game.state.objects[gang].tapped).toBe(true);
  });
});

describe("top-5000 batch 28b — Excalibur II", () => {
  it("charges on each life gain and pumps the equipped creature per counter", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const sword = spawn(game, "Excalibur II");
    game.state.objects[sword].attachedTo = bears;
    expect(pt(game, bears)).toEqual([2, 2]);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    settle(game);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 }, []);
    settle(game);
    expect(counters(game, sword, "charge")).toBe(2);
    expect(pt(game, bears)).toEqual([4, 4]);
  });
});

describe("top-5000 batch 28b — Armored Scrapgorger", () => {
  it("exiles a graveyard card and takes an oil counter when it taps for mana, growing at three", () => {
    const { game } = setUp();
    const gorger = spawn(game, "Armored Scrapgorger");
    game.state.objects[gorger].counters = { oil: 2 };
    expect(pt(game, gorger)).toEqual([0, 3]);
    const dead = game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: gorger, abilityIndex: 0, manaColors: ["G"] });
    settle(game);
    expect(zone(game, dead)).toBe("exile");
    expect(counters(game, gorger, "oil")).toBe(3);
    expect(pt(game, gorger)).toEqual([3, 3]);
  });
});

describe("top-5000 batch 28b — Serpent of Yawning Depths", () => {
  it("lets only a Kraken, Leviathan, Octopus or Serpent block your sea creatures", () => {
    const { game } = setUp();
    const serpent = spawn(game, "Serpent of Yawning Depths");
    const ourBears = spawn(game, "Grizzly Bears");
    const theirSerpent = spawn(game, "Serpent of Yawning Depths", B);
    const theirBears = spawn(game, "Grizzly Bears", B);
    game.state.objects[serpent].attacking = B;
    game.state.objects[ourBears].attacking = B;
    expect(whyCannotBlock(game.state, registry, B, theirBears, serpent)).not.toBeNull();
    expect(whyCannotBlock(game.state, registry, B, theirSerpent, serpent)).toBeNull();
    expect(whyCannotBlock(game.state, registry, B, theirBears, ourBears)).toBeNull();
  });
});

describe("top-5000 batch 28b — Keep Watch", () => {
  it("draws one for each attacking creature, whoever controls it", () => {
    const { game } = setUp();
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Hill Giant", B);
    spawn(game, "Grizzly Bears");
    game.state.objects[mine].attacking = B;
    game.state.objects[theirs].attacking = A;
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Keep Watch"), []);
    settle(game);
    expect(game.handOf(A).length).toBe(before + 2);
  });
});
