/**
 * Phase B2 of `docs/plans/engine-gaps.md` — optional target slots.
 *
 * "Up to N target …" is spelled as N slots marked `{ kind: "optional" }`
 * rather than as a variable count, so the shape of `targets` always mirrors
 * the spec list and each effect's `target:` index stays a fixed position. A
 * skipped slot travels as `null` in the dispatched action and arrives at
 * resolution as a hole (`undefined`) — which every effect already guards for,
 * because that is how an out-of-range index reads.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });

const readyLands = (game: Game, n: number, kind = "Forest") => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn(kind, A, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

const castPrimalMight = (
  game: Game,
  mine: ReturnType<Game["debugSpawn"]>,
  theirs: ReturnType<Game["debugSpawn"]> | null,
  x: number,
) => {
  const card = game.debugSpawn("Primal Might", A, "hand");
  game.dispatch({
    type: "cast-spell",
    player: A,
    card,
    xValue: x,
    targets: [
      { kind: "object", object: mine },
      theirs === null ? null : { kind: "object", object: theirs },
    ],
  });
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);
};

describe("optional target slots", () => {
  it("resolves with the optional slot filled — Primal Might fights", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 5);
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

    castPrimalMight(game, mine, theirs, 2);

    // A 4/4 fights a 2/2: theirs dies, mine survives with 2 damage.
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    expect(game.state.objects[mine].zone).toBe("battlefield");
  });

  it("resolves with the optional slot skipped — pump, no fight", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 5);
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

    castPrimalMight(game, mine, null, 2);

    // Nothing fought, so both are still around and undamaged.
    expect(game.state.objects[theirs].zone).toBe("battlefield");
    expect(game.state.objects[theirs].damageMarked).toBe(0);
    expect(game.state.objects[mine].zone).toBe("battlefield");
  });

  it("still refuses a hole in a required slot", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 5);
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    const card = game.debugSpawn("Primal Might", A, "hand");

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card,
        xValue: 0,
        // Slot 0 ("target creature you control") is not optional.
        targets: [null, null],
      }),
      // Either error is correct: `whyCannotCastSpell` rejects the cast for
      // having no legal creature to point slot 0 at before the per-slot check
      // is reached.
    ).toThrow(/needs a target for slot 0|has no legal/);
  });

  it("is castable with nothing to point the optional slot at", () => {
    // Rule 601.2c: only the *required* slots gate castability.
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 5);
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Primal Might", A, "hand");
    // No creature an opponent controls at all.
    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Primal Might");
    expect(legal).toBeDefined();
  });

  it("is not castable when a required slot has nothing to point at", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 5);
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugSpawn("Primal Might", A, "hand");
    // A controls no creature, so "target creature you control" is unfillable.
    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Primal Might");
    expect(legal).toBeUndefined();
  });

  it("copies only the slots that were filled — Hate Mirage", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    // Hate Mirage is {3}{R}.
    readyLands(game, 6, "Mountain");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const card = game.debugSpawn("Hate Mirage", A, "hand");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "object", object: theirs }, null],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);

    // A token copy carries `isToken`, not the copied card's own name.
    const copies = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].controller === A && game.state.objects[id].isToken,
    );
    expect(copies.length).toBe(1);
  });
});
