/**
 * TDC precons batch 5 — delve and "can attack as though it didn't have
 * defender" until end of turn: Treasure Cruise (delve, tested in
 * `delve.test.ts`), Assault Formation, Wakestone Gargoyle and Walking
 * Bulwark (the `attack-despite-defender` and `damage-by-toughness` effects).
 */

import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: [
      { player: A, cards: Array<string>(60).fill("Island") },
      { player: B, cards: Array<string>(60).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const [land, n] of [["Forest", 4], ["Plains", 4], ["Wastes", 4]] as const) {
    for (let i = 0; i < n; i += 1) game.debugSpawn(land, A, "battlefield", { summoningSick: false });
  }
  return game;
};

const ready = (game: Game, name: string): ObjectId =>
  game.debugSpawn(name, A, "battlefield", { summoningSick: false });

const activate = (game: Game, source: ObjectId, abilityIndex: number, targets: TargetRef[] = []): void => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets });
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
};

/** The creatures Alice may attack with, once she's asked. */
const eligibleAttackers = (game: Game): readonly ObjectId[] => {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
  const offer = game.legalActions(A).find((a) => a.kind === "declare-attackers");
  return offer?.kind === "declare-attackers" ? offer.eligible : [];
};

const attackAlone = (game: Game, attacker: ObjectId): void => {
  game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker, defender: B }] });
  game.advanceUntil((s) => s.turn.step === "end-combat" || s.result.over);
};

describe("Assault Formation", () => {
  it("lets a target defender attack this turn, dealing damage equal to its toughness", () => {
    const game = setUp();
    const formation = ready(game, "Assault Formation");
    const bulwark = ready(game, "Walking Bulwark");
    activate(game, formation, 0, [obj(bulwark)]);
    expect(eligibleAttackers(game)).toContain(bulwark);
    attackAlone(game, bulwark);
    // A 0/3: three damage, by toughness.
    expect(game.state.players[B].life).toBe(17);
  });

  it("without the activation, the defender can't attack", () => {
    const game = setUp();
    ready(game, "Assault Formation");
    const bulwark = ready(game, "Walking Bulwark");
    expect(eligibleAttackers(game)).not.toContain(bulwark);
  });

  it("can't target a creature without defender", () => {
    const game = setUp();
    const formation = ready(game, "Assault Formation");
    const bears = ready(game, "Grizzly Bears");
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: formation, abilityIndex: 0, targets: [obj(bears)] }),
    ).toThrow();
  });

  it("gives creatures you control +0/+1 until end of turn", () => {
    const game = setUp();
    const formation = ready(game, "Assault Formation");
    const bears = ready(game, "Grizzly Bears");
    activate(game, formation, 1);
    expect(computeCharacteristics(game.state, game.registry, bears).toughness).toBe(3);
  });
});

describe("Wakestone Gargoyle", () => {
  it("lets every defender you control attack this turn, one that arrives later too", () => {
    const game = setUp();
    const gargoyle = ready(game, "Wakestone Gargoyle");
    activate(game, gargoyle, 0);
    // Put onto the battlefield after the ability resolved (the ruling).
    const later = ready(game, "Walking Bulwark");
    const theirs = game.debugSpawn("Walking Bulwark", B, "battlefield", { summoningSick: false });
    const eligible = eligibleAttackers(game);
    expect(eligible).toContain(gargoyle);
    expect(eligible).toContain(later);
    expect(game.state.turnDefenderAttacks).toHaveLength(1);
    // Only Alice's side.
    expect(eligible).not.toContain(theirs);
  });

  it("lasts only this turn", () => {
    const game = setUp();
    const gargoyle = ready(game, "Wakestone Gargoyle");
    activate(game, gargoyle, 0);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.turnDefenderAttacks).toBeUndefined();
  });
});

describe("Walking Bulwark", () => {
  it("gives a defender haste, the attack and damage by toughness, but not more power", () => {
    const game = setUp();
    const bulwark = ready(game, "Walking Bulwark");
    // Just arrived: only haste lets it attack.
    const gargoyle = game.debugSpawn("Wakestone Gargoyle", A, "battlefield");
    activate(game, bulwark, 0, [obj(gargoyle)]);
    const c = computeCharacteristics(game.state, game.registry, gargoyle);
    expect(c.power).toBe(3);
    expect(c.damageByToughness).toBe(true);
    expect(eligibleAttackers(game)).toContain(gargoyle);
    attackAlone(game, gargoyle);
    expect(game.state.players[B].life).toBe(16);
  });

  it("activates only as a sorcery", () => {
    const game = setUp();
    const bulwark = ready(game, "Walking Bulwark");
    const gargoyle = ready(game, "Wakestone Gargoyle");
    // Offered in the main phase, refused at the beginning of combat.
    expect(
      game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === bulwark),
    ).toBe(true);
    game.advanceUntil((s) => s.turn.step === "begin-combat" && s.priority.holder === A);
    expect(game.state.turn.step).toBe("begin-combat");
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: bulwark, abilityIndex: 0, targets: [obj(gargoyle)] }),
    ).toThrow();
  });
});
