/**
 * Rule 608.2b: a spell or ability whose targets have all become illegal
 * doesn't resolve; otherwise it resolves, and a target that became illegal
 * isn't affected by it, nor can anything about it be found out — a part of
 * the effect that needs that information doesn't happen. A slot an "up to
 * one" left empty isn't a target at all, and doesn't stop the rest.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: createDefaultRegistry(),
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, names: readonly string[]): void => {
  for (const name of names) spawn(game, name);
};
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const HEXPROOF: EffectSpec = { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" };

describe("a target gone illegal beside a legal one (rule 608.2b)", () => {
  it("isn't affected: Rabid Bite doesn't damage a creature that gained hexproof", () => {
    const game = setUp();
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, ["Forest", "Forest"]);
    const bite = game.debugSpawn("Rabid Bite", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bite, targets: [obj(giant), obj(bears)] });
    game.debugApplyEffect(B, HEXPROOF, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].damageMarked).toBe(0);
  });

  it("can't be read: Rabid Bite does nothing once the biter is no longer yours", () => {
    const game = setUp();
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, ["Forest", "Forest"]);
    const bite = game.debugSpawn("Rabid Bite", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bite, targets: [obj(giant), obj(bears)] });
    game.debugApplyEffect(B, { kind: "gain-control", target: 0, untilEndOfTurn: true }, [obj(giant)]);
    game.advanceUntil(quiet);
    // The other target is still legal, so it resolves — but its damage is
    // the biter's power, which can't be found out.
    expect(game.eventsOfType("spell-fizzled")).toHaveLength(0);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].damageMarked).toBe(0);
  });

  it("the legal one still is: Kolaghan's Command's discard happens beside a hexproofed damage target", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, ["Forest", "Swamp", "Mountain"]);
    const command = game.debugSpawn("Kolaghan's Command", A, "hand");
    game.debugSpawn("Forest", B, "hand");
    const hand = game.handOf(B).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: command,
      modes: [1, 3],
      targets: [{ kind: "player", player: B }, obj(bears)],
    });
    game.debugApplyEffect(B, HEXPROOF, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(game.handOf(B)).toHaveLength(hand - 1);
    expect(game.state.objects[bears].damageMarked).toBe(0);
  });
});

describe("every target illegal", () => {
  it("nothing happens, a target-less mode included: Scour for Scrap searches nothing", () => {
    const game = setUp();
    lands(game, ["Island", "Island", "Island", "Island"]);
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    const scour = game.debugSpawn("Scour for Scrap", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: scour, modes: [0, 1], targets: [obj(ring)] });
    game.debugApplyEffect(B, { kind: "exile", target: 0 }, [obj(ring)]);
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-fizzled").map((e) => e.object)).toContain(scour);
    expect(game.eventsOfType("library-shuffled").filter((e) => e.player === A)).toHaveLength(0);
  });
});

describe("an \"up to one\" target left empty", () => {
  it("isn't a target: the rest still happens", () => {
    const game = setUp();
    const legionnaire = spawn(game, "Unliving Legionnaire");
    lands(game, ["Swamp", "Swamp", "Swamp", "Swamp", "Swamp", "Swamp", "Swamp"]);
    const offer = game.legalActions(A).find((a) => a.kind === "activate-ability" && a.source === legionnaire);
    if (offer === undefined || offer.kind !== "activate-ability") throw new Error("the power-up isn't offered");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: legionnaire,
      abilityIndex: offer.abilityIndex,
      targets: [null],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[legionnaire].counters["+1/+1"]).toBe(2);
  });
});
