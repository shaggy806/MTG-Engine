/**
 * Top-5000 batch 27d. No engine change: each test pins the clause of a card
 * most likely to be wired wrong — Moogles' Valor's indestructible reaching
 * the Moogles it just made, High-Society Hunter's optional sacrifice feeding
 * both its counter and its own draw trigger, Thieving Varmint's restricted
 * two-of-one-colour mana, Zuko's Exile's Clue going to the exiled
 * permanent's controller, Light of Promise's granted "that many" counters,
 * and Urza, Prince of Kroog's 1/1 Soldier copy under its own anthem.
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const count = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
/** Resolve everything, saying yes to every "may" and sacrificing the first
 * eligible permanent when a sacrifice is asked. */
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else if (awaiting.kind === "sacrifice") {
      game.dispatch({ type: "sacrifice", player: awaiting.player, permanents: [awaiting.eligible[0]] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;

describe("top-5000 batch 27d — Moogles' Valor", () => {
  it("makes a Moogle per creature, then every creature you control — the Moogles too — is indestructible", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effectOf("Moogles' Valor"), []);
    settle(game);
    expect(count(game, "Moogle Token")).toBe(2);
    for (const id of [bears, ...named(game, "Moogle Token")]) {
      expect(computeCharacteristics(game.state, registry, id).keywords.has("indestructible")).toBe(true);
    }
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("indestructible")).toBe(false);
  });
});

describe("top-5000 batch 27d — High-Society Hunter", () => {
  it("sacrifices another creature for a counter, and that death draws a card", () => {
    const { game } = setUp();
    const hunter = spawn(game, "High-Society Hunter");
    const bears = spawn(game, "Grizzly Bears");
    const handBefore = game.handOf(A).length;
    const attack = registry.get("High-Society Hunter")!.triggered[0].effect!;
    game.debugApplyEffect(A, attack, [], { source: hunter });
    settle(game);
    expect(zone(game, hunter)).toBe("battlefield");
    expect(zone(game, bears)).toBe("graveyard");
    expect(counters(game, hunter)).toBe(1);
    expect(game.handOf(A)).toHaveLength(handBefore + 1);
  });

  it("draws nothing when a token dies", () => {
    const { game } = setUp();
    spawn(game, "High-Society Hunter");
    game.debugApplyEffect(A, { kind: "create-token", token: "Moogle Token", count: 1 }, []);
    settle(game);
    const moogle = named(game, "Moogle Token")[0];
    const handBefore = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: moogle }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore);
  });
});

describe("top-5000 batch 27d — Thieving Varmint", () => {
  it("pays 1 life for two mana of one colour, spendable only on spells you don't own", () => {
    const { game } = setUp(["Divination"]);
    const varmint = spawn(game, "Thieving Varmint");
    spawn(game, "Island");
    const divination = game.handOf(A).find((id) => game.state.objects[id].cardName === "Divination")!;
    // Island + the Varmint's two would be enough mana — but Divination is Alice's own.
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === divination)).toBe(false);
    game.dispatch({ type: "activate-ability", player: A, source: varmint, abilityIndex: 0, manaColors: ["B"] });
    const units = game.state.players[A].manaPool;
    expect(units.map((u) => u.type)).toEqual(["B", "B"]);
    for (const unit of units) expect(unit.restriction?.spell).toEqual({ ownedBy: "opponent" });
    expect(life(game, A)).toBe(19);
  });
});

describe("top-5000 batch 27d — Zuko's Exile", () => {
  it("exiles the permanent and its controller, not the caster, gets the Clue", () => {
    const { game } = setUp();
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effectOf("Zuko's Exile"), [{ kind: "object", object: theirs }]);
    settle(game);
    expect(zone(game, theirs)).toBe("exile");
    const clues = named(game, "Clue Token");
    expect(clues).toHaveLength(1);
    expect(game.state.objects[clues[0]].controller).toBe(B);
  });
});

describe("top-5000 batch 27d — Light of Promise", () => {
  it("gives the enchanted creature that many +1/+1 counters when its controller gains life", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const other = spawn(game, "Hill Giant");
    const aura = spawn(game, "Light of Promise");
    game.state.objects[aura].attachedTo = bears;
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    settle(game);
    expect(counters(game, bears)).toBe(3);
    expect(counters(game, other)).toBe(0);
    // An opponent's life gain isn't "you gain life".
    game.debugApplyEffect(B, { kind: "gain-life", amount: 2 }, []);
    settle(game);
    expect(counters(game, bears)).toBe(3);
  });
});

describe("top-5000 batch 27d — Urza, Prince of Kroog", () => {
  it("copies an artifact as a 1/1 Soldier artifact creature, which its anthem makes 3/3", () => {
    const { game } = setUp();
    const urza = spawn(game, "Urza, Prince of Kroog");
    const ring = spawn(game, "Sol Ring");
    const copy = registry.get("Urza, Prince of Kroog")!.activated[0].effect!;
    const before = new Set(game.battlefield);
    game.debugApplyEffect(A, copy, [{ kind: "object", object: ring }], { source: urza });
    settle(game);
    const tokens = game.battlefield.filter((id) => !before.has(id));
    expect(tokens).toHaveLength(1);
    const c = computeCharacteristics(game.state, registry, tokens[0]);
    expect(c.types).toContain("artifact");
    expect(c.types).toContain("creature");
    expect(c.subtypes).toContain("Soldier");
    expect([c.power, c.toughness]).toEqual([3, 3]);
    // The original stays a noncreature artifact.
    expect(computeCharacteristics(game.state, registry, ring).types).not.toContain("creature");
  });
});
