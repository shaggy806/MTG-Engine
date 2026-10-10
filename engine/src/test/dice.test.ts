/**
 * Rolling dice (rule 706): the `roll-dice` effect, its results table and
 * `{ roll }` amounts, the `rolls-dice` trigger, and the cards built on them.
 * The rolls come from the game's seeded stream, so each test checks what
 * happened against the roll recorded (`GameState.lastRoll`, the
 * `dice-rolled` event) rather than forcing a number. Written on the shared
 * table in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { Game } from "../game.js";

import { A, B, attack, cast, counters, lands, life, settle, spawn, table, toHand, tokensNamed } from "./harness.js";

const rolls = (game: Game) => game.state.eventLog.filter((e) => e.type === "dice-rolled");

describe("roll-dice", () => {
  it("rolls on the seeded stream, the same game twice", () => {
    const once = (): readonly number[] => {
      const { game, a } = table({ seed: 7 });
      const dragon = spawn(game, "Ancient Copper Dragon");
      attack(game, a, [dragon]);
      settle(game);
      return game.state.lastRoll?.results ?? [];
    };
    const first = once();
    expect(first).toHaveLength(1);
    expect(first[0]).toBeGreaterThanOrEqual(1);
    expect(first[0]).toBeLessThanOrEqual(20);
    expect(once()).toEqual(first);
  });

  it("Ancient Copper Dragon: as many Treasures as the d20 shows", () => {
    const { game, a } = table();
    const dragon = spawn(game, "Ancient Copper Dragon");
    attack(game, a, [dragon]);
    settle(game);
    const roll = rolls(game);
    expect(roll).toHaveLength(1);
    const e = roll[0];
    if (e.type !== "dice-rolled") return;
    expect(e.sides).toBe(20);
    expect(e.player).toBe(A);
    expect(tokensNamed(game, "Treasure Token", A)).toBe(e.results[0]);
  });

  it("Hoarding Ogre: the results table row that holds the roll", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { game, a } = table({ seed });
      const ogre = spawn(game, "Hoarding Ogre");
      attack(game, a, [ogre]);
      settle(game);
      const total = game.state.lastRoll!.total;
      const expected = total <= 9 ? 1 : total <= 19 ? 2 : 3;
      expect(tokensNamed(game, "Treasure Token", A)).toBe(expected);
    }
  });

  it("Clown Car: X dice, a Clown Robot per odd result and a counter per even one", () => {
    const { game } = table();
    lands(game, "Wastes", 4);
    const car = toHand(game, "Clown Car");
    cast(game, car, { x: 4 });
    const last = game.state.lastRoll!;
    expect(last.results).toHaveLength(4);
    const odd = last.results.filter((r) => r % 2 === 1).length;
    expect(tokensNamed(game, "Clown Robot Token", A)).toBe(odd);
    expect(counters(game, car)).toBe(4 - odd);
  });

  it("Clown Car with X of 0 rolls nothing", () => {
    const { game } = table();
    const car = toHand(game, "Clown Car");
    cast(game, car, { x: 0 });
    expect(rolls(game)).toHaveLength(0);
  });

  it("Brazen Dwarf: once per roll, whatever it took", () => {
    const { game } = table();
    spawn(game, "Brazen Dwarf");
    lands(game, "Wastes", 3);
    cast(game, toHand(game, "Clown Car"), { x: 3 });
    expect(rolls(game)).toHaveLength(1);
    expect(life(game, B)).toBe(19);
  });

  it("Contraband Livestock: the creature's controller gets the row's token", () => {
    const { game } = table();
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    cast(game, toHand(game, "Contraband Livestock"), { targets: [{ kind: "object", object: bears }] });
    expect(game.state.objects[bears].zone).toBe("exile");
    const total = game.state.lastRoll!.total;
    const token = total <= 9 ? "4/4 Green Ox Token" : total <= 19 ? "Boar Token" : "Goat Token";
    expect(tokensNamed(game, token, B)).toBe(1);
    expect(tokensNamed(game, token, A)).toBe(0);
  });
});
