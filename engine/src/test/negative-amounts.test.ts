/**
 * Rule 107.1b: a calculation that comes out negative uses 0, unless the
 * effect doubles a creature's power or toughness. Only the calculation's
 * result is clamped, and a P/T change keeps the card's own minus sign.
 */

import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const power = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id).power;
const toughness = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id).toughness;
/** Grizzly Bears at -2/2. */
const shrunkBears = (game: Game): ObjectId => {
  const bears = spawn(game, "Grizzly Bears");
  game.debugApplyEffect(A, { kind: "modify-pt", target: 0, power: -4, toughness: 0, duration: "end-of-turn" }, [
    obj(bears),
  ]);
  expect(power(game, bears)).toBe(-2);
  return bears;
};

describe("negative amounts (rule 107.1b)", () => {
  it("a sacrificed creature's negative power gains no life and adds no counters (Dina, Essence Brewer)", () => {
    const game = setUp();
    const dina = spawn(game, "Dina, Essence Brewer");
    for (let i = 0; i < 2; i += 1) spawn(game, "Swamp");
    const bears = shrunkBears(game);
    const target = spawn(game, "Hill Giant");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: dina,
      abilityIndex: 0,
      targets: [obj(target)],
      sacrifice: bears,
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.players[A].life).toBe(20);
    expect(game.state.objects[target].counters["+1/+1"] ?? 0).toBe(0);
  });

  it("a -X/-X keeps its sign (The Meathook Massacre)", () => {
    const game = setUp();
    const giant = spawn(game, "Hill Giant", B);
    const meathook = spawn(game, "The Meathook Massacre");
    game.debugApplyEffect(
      A,
      {
        kind: "modify-pt-all",
        filter: { type: "creature" },
        power: { product: ["x", -1] },
        toughness: { product: ["x", -1] },
        duration: "end-of-turn",
      },
      [],
      { source: meathook, x: 2 },
    );
    expect(power(game, giant)).toBe(1);
    expect(toughness(game, giant)).toBe(1);
  });

  it("\"+X/+X where X is its power\" adds nothing for a negative power", () => {
    const game = setUp();
    const bears = shrunkBears(game);
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: { powerOf: 0 }, toughness: { powerOf: 0 }, duration: "end-of-turn" },
      [obj(bears)],
    );
    expect(power(game, bears)).toBe(-2);
    expect(toughness(game, bears)).toBe(2);
  });

  it("doubling a negative power makes it more negative (Unleash Fury, rule 701.10d)", () => {
    const game = setUp();
    const bears = shrunkBears(game);
    const fury = game.debugSpawn("Unleash Fury", A, "hand");
    for (let i = 0; i < 2; i += 1) spawn(game, "Mountain");
    game.dispatch({ type: "cast-spell", player: A, card: fury, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(power(game, bears)).toBe(-4);
  });

  it("the difference between a negative power and a toughness is taken as written (Doran's X)", () => {
    const game = setUp();
    const bears = shrunkBears(game);
    game.debugApplyEffect(
      A,
      {
        kind: "gain-life",
        amount: { difference: [{ powerOf: 0 }, { toughnessOf: 0 }], absolute: true },
      },
      [obj(bears)],
    );
    expect(game.state.players[A].life).toBe(24);
  });
});
