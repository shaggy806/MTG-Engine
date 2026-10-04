/**
 * Top-5000 batch 19a. No engine change: each test pins the clause of a card
 * most likely to be wired wrong — Silkguard's hexproof over Auras, Equipment
 * and *modified* creatures (after its own counters), Sandwurm Convergence's
 * "creatures with flying" read off current keywords and covering your
 * planeswalkers, Whelming Wave's exceptions against a changeling, Samwise's
 * historic filter and three-Food cost, Circle of Power's Wizards including
 * the token it just made, both of Your Temple Is Under Attack's modes, and
 * Lord Skitter's "another Rat".
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { whyCannotAttack } from "../combat/eligibility.js";
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

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const named = (game: Game, name: string, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player,
  );
const tokenCount = (game: Game, name: string, player: PlayerId = A): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const hasKeyword = (game: Game, id: ObjectId, keyword: string): boolean =>
  game.characteristics(id).keywords.has(keyword as never);
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
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
type AbilityOffer = Extract<LegalAction, { kind: "activate-ability" }>;
const offers = (game: Game, source: ObjectId, index = 0): AbilityOffer[] =>
  game
    .legalActions(A)
    .filter(
      (a): a is AbilityOffer => a.kind === "activate-ability" && a.source === source && a.abilityIndex === index,
    );
const sacrificeOffer = (game: Game): Extract<LegalAction, { kind: "sacrifice" }> | undefined =>
  game.legalActions(A).find((a): a is Extract<LegalAction, { kind: "sacrifice" }> => a.kind === "sacrifice");

describe("top-5000 batch 19a — Silkguard", () => {
  it("counters its targets, then hexproofs Auras, Equipment and modified creatures you control", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    const sword = spawn(game, "Bonesplitter");
    game.state.objects[sword].attachedTo = elves;
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, effectOf("Silkguard"), [{ kind: "object", object: bears }], { x: 1 });
    settle(game);
    expect(counters(game, bears)).toBe(1);
    // Modified by the counter it just got.
    expect(hasKeyword(game, bears, "hexproof")).toBe(true);
    // Equipped, and the Equipment itself.
    expect(hasKeyword(game, elves, "hexproof")).toBe(true);
    expect(hasKeyword(game, sword, "hexproof")).toBe(true);
    // Unmodified, and an opponent's modified creature.
    expect(hasKeyword(game, giant, "hexproof")).toBe(false);
    expect(hasKeyword(game, theirs, "hexproof")).toBe(false);
  });
});

describe("top-5000 batch 19a — Sandwurm Convergence", () => {
  it("stops creatures with flying (even granted) attacking you or your planeswalkers", () => {
    const game = setUp();
    spawn(game, "Sandwurm Convergence");
    const walker = spawn(game, "Chandra, Acolyte of Flame");
    const drake = spawn(game, "Wind Drake", B);
    const bears = spawn(game, "Grizzly Bears", B);
    expect(whyCannotAttack(game.state, registry, B, drake, A)).not.toBeNull();
    expect(whyCannotAttack(game.state, registry, B, drake, walker)).not.toBeNull();
    expect(whyCannotAttack(game.state, registry, B, bears, A)).toBeNull();
    game.debugApplyEffect(B, { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" }, [
      { kind: "object", object: bears },
    ]);
    settle(game);
    expect(whyCannotAttack(game.state, registry, B, bears, A)).not.toBeNull();
  });
});

describe("top-5000 batch 19a — Whelming Wave", () => {
  it("bounces every creature but Krakens, Leviathans, Octopuses and Serpents; a changeling stays", () => {
    const game = setUp();
    const kraken = spawn(game, "Kraken Hatchling");
    const changeling = spawn(game, "Changeling Outcast");
    const bears = spawn(game, "Grizzly Bears");
    const drake = spawn(game, "Wind Drake", B);
    game.debugApplyEffect(A, effectOf("Whelming Wave"));
    settle(game);
    expect(zone(game, kraken)).toBe("battlefield");
    expect(zone(game, changeling)).toBe("battlefield");
    expect(game.handOf(A)).toContain(bears);
    expect(game.handOf(B)).toContain(drake);
  });
});

describe("top-5000 batch 19a — Samwise Gamgee", () => {
  it("makes Food for another nontoken creature, and three Foods return a historic card only", () => {
    const game = setUp();
    const samwise = spawn(game, "Samwise Gamgee");
    expect(tokenCount(game, "Food Token")).toBe(0);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(tokenCount(game, "Food Token")).toBe(1);
    game.debugApplyEffect(A, { kind: "create-token", token: "Food Token", count: 2 });
    settle(game);
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    const deadBears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const offer = offers(game, samwise)[0];
    expect(offer).toBeDefined();
    const options = offer.targetOptions[0].map((ref) => (ref.kind === "object" ? ref.object : null));
    expect(options).toContain(ring);
    expect(options).not.toContain(deadBears);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: samwise,
      abilityIndex: 0,
      targets: [{ kind: "object", object: ring }],
    });
    if (game.state.awaiting?.kind === "sacrifice") {
      const eligible = sacrificeOffer(game)?.eligible ?? [];
      game.dispatch({ type: "sacrifice", player: A, permanents: eligible.slice(0, 3) });
    }
    game.advanceUntil(quiet);
    expect(tokenCount(game, "Food Token")).toBe(0);
    expect(game.handOf(A)).toContain(ring);
  });
});

describe("top-5000 batch 19a — Circle of Power", () => {
  it("draws two, loses 2, and pumps your Wizards, the new token among them", () => {
    const game = setUp();
    const mine = spawn(game, "Archmage Emeritus");
    const theirs = spawn(game, "Archmage Emeritus", B);
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Circle of Power"));
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 2);
    expect(game.state.players[A].life).toBe(18);
    const [wizard] = named(game, "Wizard Token (Kuja)");
    expect(wizard).toBeDefined();
    expect(game.characteristics(wizard).power).toBe(1);
    expect(hasKeyword(game, wizard, "lifelink")).toBe(true);
    expect(game.characteristics(mine).power).toBe(3);
    expect(hasKeyword(game, mine, "lifelink")).toBe(true);
    expect(game.characteristics(theirs).power).toBe(2);
    expect(hasKeyword(game, theirs, "lifelink")).toBe(false);
  });
});

describe("top-5000 batch 19a — Your Temple Is Under Attack", () => {
  it("makes only your creatures indestructible, or has you and the opponent each draw two", () => {
    const game = setUp();
    const modes = registry.get("Your Temple Is Under Attack")!.castModal!.modes;
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, modes[0].effect!);
    settle(game);
    expect(hasKeyword(game, mine, "indestructible")).toBe(true);
    expect(hasKeyword(game, theirs, "indestructible")).toBe(false);
    const handA = game.handOf(A).length;
    const handB = game.handOf(B).length;
    game.debugApplyEffect(A, modes[1].effect!, [{ kind: "player", player: B }]);
    settle(game);
    expect(game.handOf(A).length).toBe(handA + 2);
    expect(game.handOf(B).length).toBe(handB + 2);
  });
});

describe("top-5000 batch 19a — Lord Skitter, Sewer King", () => {
  it("doesn't trigger on itself; its combat Rat exiles a card from an opponent's graveyard", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const giant = game.debugSpawn("Hill Giant", B, "graveyard");
    const skitter = game.debugSpawn("Lord Skitter, Sewer King", A, "battlefield", { announceEntry: true });
    game.state.objects[skitter].summoningSick = false;
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, giant)).toBe("graveyard");
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    settle(game);
    expect(tokenCount(game, "Rat Token (Can't Block)")).toBe(1);
    expect([zone(game, bears), zone(game, giant)].filter((z) => z === "exile")).toHaveLength(1);
  });
});
