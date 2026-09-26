/**
 * Zaxara, the Exemplary — {1}{B}{G}{U} legendary 2/3 Nightmare Hydra.
 *
 *   Deathtouch
 *   {T}: Add two mana of any one color.
 *   Whenever you cast a spell with {X} in its mana cost, create a 0/0 green
 *   Hydra creature token, then put X +1/+1 counters on it.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();
const HYDRA = "Hydra Token";

/** Zaxara and five Islands for Alice. */
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
  game.debugSpawn("Zaxara, the Exemplary", A, "battlefield", { summoningSick: false });
  for (let i = 0; i < 5; i += 1) game.debugSpawn("Island", A, "battlefield");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const hydras = (game: Game): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === HYDRA);
/** Cast Mind Spring ({X}{U}{U}) with this X; the trigger is on the stack after. */
const castMindSpring = (game: Game, x: number): ObjectId => {
  const card = game.debugSpawn("Mind Spring", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, xValue: x });
  return card;
};

describe("Zaxara, the Exemplary", () => {
  it("an {X} spell makes a 0/0 Hydra with X +1/+1 counters put on it", () => {
    const game = setUp();
    castMindSpring(game, 2);
    game.advanceUntil(quiet);
    const made = hydras(game);
    expect(made).toHaveLength(1);
    const hydra = made[0];
    expect(game.state.objects[hydra].counters["+1/+1"]).toBe(2);
    const c = game.characteristics(hydra);
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect([...c.colors]).toEqual(["G"]);
    // Put on it after it entered — not counters it entered with.
    const entered = game.eventsOfType("permanent-entered-battlefield").findIndex((e) => e.object === hydra);
    const counters = game.eventsOfType("counter-added").findIndex((e) => e.object === hydra);
    const all = game.state.eventLog;
    expect(entered).toBeGreaterThanOrEqual(0);
    expect(counters).toBeGreaterThanOrEqual(0);
    const at = (type: string) => all.findIndex((e) => e.type === type && "object" in e && e.object === hydra);
    expect(at("permanent-entered-battlefield")).toBeLessThan(at("counter-added"));
  });

  it("with X = 0 the Hydra is a 0/0, and dies", () => {
    const game = setUp();
    castMindSpring(game, 0);
    game.advanceUntil(quiet);
    expect(hydras(game)).toEqual([]);
    expect(Object.values(game.state.ceasedTokens ?? {}).some((t) => t.name === HYDRA)).toBe(true);
  });

  it("a spell without {X} makes nothing", () => {
    const game = setUp();
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Opt", A, "hand") });
    game.advanceUntil(quiet);
    expect(hydras(game)).toEqual([]);
    // Not even one that died at once, as a Hydra made with X = 0 would.
    expect(Object.values(game.state.ceasedTokens ?? {}).some((t) => t.name === HYDRA)).toBe(false);
  });

  it("the X is the spell's as it was cast, even if the spell is countered first", () => {
    const game = setUp();
    const spell = castMindSpring(game, 3);
    game.advanceUntil((s) => s.pendingTriggers.length === 0 && s.zones.shared.stack.length === 2);
    game.debugApplyEffect(B, { kind: "counter", target: 0 }, [{ kind: "object", object: spell }]);
    expect(game.state.objects[spell].zone).toBe("graveyard");
    game.advanceUntil(quiet);
    const made = hydras(game);
    expect(made).toHaveLength(1);
    expect(game.state.objects[made[0]].counters["+1/+1"]).toBe(3);
  });

  it("under Doubling Season: two Hydras, each with twice X counters", () => {
    const game = setUp();
    game.debugSpawn("Doubling Season", A, "battlefield");
    castMindSpring(game, 1);
    game.advanceUntil(quiet);
    const made = hydras(game);
    expect(made).toHaveLength(2);
    for (const id of made) expect(game.state.objects[id].counters["+1/+1"]).toBe(2);
  });
});
