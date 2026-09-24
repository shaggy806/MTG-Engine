import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

// Kilo, Apogee Mind: "Haste. Whenever Kilo becomes tapped, proliferate."
// It was authored once and dropped because the engine chose which creature
// paid a "tap an untapped creature you control" cost, so a player could
// never tap Kilo that way. That cost is the player's choice now.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const withCounters = (game: Game, id: ObjectId, n: number): ObjectId => {
  game.state.objects[id].counters = { "+1/+1": n };
  return id;
};

/** Settle to Kilo's proliferate decision and answer it with `chosen`. */
const proliferate = (game: Game, chosen: readonly ObjectId[]): void => {
  game.advanceUntil((s) => s.awaiting !== null || settled(s));
  expect(game.state.awaiting?.kind).toBe("proliferate");
  game.dispatch({
    type: "proliferate",
    player: A,
    chosen: chosen.map((object) => ({ kind: "object", object })),
  });
  game.advanceUntil(settled);
};

describe("Kilo, Apogee Mind", () => {
  it("proliferates when it attacks the turn it arrives (haste)", () => {
    const game = mkGame();
    const kilo = game.debugSpawn("Kilo, Apogee Mind", A, "battlefield");
    const bears = withCounters(game, game.debugSpawn("Grizzly Bears", A, "battlefield"), 1);
    expect(game.state.objects[kilo].summoningSick).toBe(true);

    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: kilo, defender: B }] });
    proliferate(game, [bears]);

    expect(game.state.objects[kilo].tapped).toBe(true);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(2);
  });

  it("proliferates when the player taps it to pay another permanent's tap cost", () => {
    const game = mkGame();
    const kilo = game.debugSpawn("Kilo, Apogee Mind", A, "battlefield", { summoningSick: false });
    const evangel = game.debugSpawn("Selesnya Evangel", A, "battlefield", { summoningSick: false });
    const bears = withCounters(
      game,
      game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false }),
      2,
    );
    game.debugSpawn("Forest", A, "battlefield");

    // Selesnya Evangel: "{1}, {T}, Tap an untapped creature you control" —
    // the Bears and Kilo are both candidates, and the player picks Kilo.
    game.dispatch({ type: "activate-ability", player: A, source: evangel, abilityIndex: 0, tap: [kilo] });
    proliferate(game, [bears]);

    expect(game.state.objects[kilo].tapped).toBe(true);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(3);
  });

  it("doesn't trigger when something else pays the cost", () => {
    const game = mkGame();
    const kilo = game.debugSpawn("Kilo, Apogee Mind", A, "battlefield", { summoningSick: false });
    const evangel = game.debugSpawn("Selesnya Evangel", A, "battlefield", { summoningSick: false });
    const bears = withCounters(
      game,
      game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false }),
      2,
    );
    game.debugSpawn("Forest", A, "battlefield");

    game.dispatch({ type: "activate-ability", player: A, source: evangel, abilityIndex: 0, tap: [bears] });
    game.advanceUntil((s) => s.awaiting !== null || settled(s));

    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[kilo].tapped).toBe(false);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(2);
  });
});
