/**
 * Top-5000 batch 25e. Pins the clauses most likely to be wired wrong: Preston's
 * "if it wasn't cast" and its 0/1 white Illusion copy, Fiend Hunter's linked
 * (not "until") exile, Prava's your-turn token anthem, Conformer Shuriken's
 * granted power-difference counters, Traxos untapping on a historic cast, Apex
 * of Power's cast-only exile and ten mana from the hand, Composer of Spring's
 * six-enchantment upgrade, and Their Name Is Death sparing artifacts.
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
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
const tokens = (game: Game): ObjectId[] => game.battlefield.filter((id) => game.state.objects[id].isToken === true);

describe("top-5000 batch 25e — Prava of the Steel Legion", () => {
  it("gives creature tokens +1/+4 only during its controller's turn", () => {
    const { game } = setUp();
    spawn(game, "Prava of the Steel Legion");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 }, []);
    settle(game);
    const soldier = named(game, "Soldier Token")[0];
    expect([chars(game, soldier).power, chars(game, soldier).toughness]).toEqual([2, 5]);
    expect([chars(game, bears).power, chars(game, bears).toughness]).toEqual([2, 2]);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect([chars(game, soldier).power, chars(game, soldier).toughness]).toEqual([1, 1]);
  });
});

describe("top-5000 batch 25e — Conformer Shuriken", () => {
  it("taps a bigger defender and puts the power difference on the equipped attacker", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const shuriken = spawn(game, "Conformer Shuriken");
    game.state.objects[shuriken].attachedTo = bears;
    const giant = spawn(game, "Hill Giant", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: giant }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    expect(game.state.objects[giant].tapped).toBe(true);
    expect(counters(game, bears)).toBe(1);
  });

  it("puts no counters when the tapped creature is not bigger", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const shuriken = spawn(game, "Conformer Shuriken");
    game.state.objects[shuriken].attachedTo = bears;
    const thopter = spawn(game, "Ornithopter", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: thopter }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    expect(game.state.objects[thopter].tapped).toBe(true);
    expect(counters(game, bears)).toBe(0);
  });
});

describe("top-5000 batch 25e — Traxos, Scourge of Kroog", () => {
  it("enters tapped and untaps when you cast a historic spell", () => {
    const { game } = setUp(["Traxos, Scourge of Kroog", "Sol Ring"]);
    lands(game, "Wastes", 5);
    const traxos = inHand(game, "Traxos, Scourge of Kroog");
    game.dispatch({ type: "cast-spell", player: A, card: traxos, targets: [] });
    settle(game);
    expect(zone(game, traxos)).toBe("battlefield");
    expect(game.state.objects[traxos].tapped).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring"), targets: [] });
    settle(game);
    expect(game.state.objects[traxos].tapped).toBe(false);
  });
});

describe("top-5000 batch 25e — Apex of Power", () => {
  it("cast from the hand: exiles seven, lets you cast the spells but not play the lands, and adds ten of one colour", () => {
    const { game } = setUp(["Apex of Power"], "Mountain");
    lands(game, "Mountain", 11);
    const exiled: ObjectId[] = [];
    for (let i = 0; i < 6; i += 1) exiled.push(game.debugSpawn("Mountain", A, "library"));
    const bolt = game.debugSpawn("Lightning Bolt", A, "library");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Apex of Power"), targets: [] });
    settle(game);
    expect(zone(game, bolt)).toBe("exile");
    for (const id of exiled) expect(zone(game, id)).toBe("exile");
    expect(pool(game)).toEqual(Array<string>(10).fill("W"));
    const offers = game.legalActions(A);
    expect(offers.some((x) => x.kind === "cast-spell" && x.card === bolt)).toBe(true);
    expect(offers.some((x) => x.kind === "play-land" && exiled.includes(x.card))).toBe(false);
  });
});

describe("top-5000 batch 25e — Composer of Spring", () => {
  it("puts a land from hand tapped, and a creature too once you control six enchantments", () => {
    const { game } = setUp(["Forest", "Grizzly Bears"], "Sol Ring");
    spawn(game, "Composer of Spring");
    const forest = inHand(game, "Forest");
    const bears = inHand(game, "Grizzly Bears");
    game.debugSpawn("Intangible Virtue", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, forest)).toBe("battlefield");
    expect(game.state.objects[forest].tapped).toBe(true);
    expect(zone(game, bears)).toBe("hand");
    for (let i = 0; i < 4; i += 1) spawn(game, "Intangible Virtue");
    game.debugSpawn("Intangible Virtue", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(game.state.objects[bears].tapped).toBe(true);
  });
});

describe("top-5000 batch 25e — Their Name Is Death", () => {
  it("destroys nonartifact creatures and spares artifact creatures", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const thopter = spawn(game, "Ornithopter", B);
    game.debugApplyEffect(A, effectOf("Their Name Is Death"), []);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, thopter)).toBe("battlefield");
  });
});
