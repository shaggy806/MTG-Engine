/**
 * The small vocabulary additions the bulk precon pass needed, and a sample of
 * the cards that use them:
 *
 * - `toControllerOfTarget` on `gain-life` and `lose-life`, matching the field
 *   `damage` already had (Swords to Plowshares, Undermine).
 * - `EffectAmount` `{ countPlayers }` (Inspired Sphinx).
 * - `AffectSpec.withKeyword` in anger — the anthem shape that most of First
 *   Flight is built on (Favorable Winds, Empyrean Eagle).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const makeGame = (players: readonly PlayerId[] = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({
      player,
      cards: Array<string>(40).fill("Plains"),
    })),
  });

/** A's first main phase with `n` untapped lands of each basic type. */
const openWith = (game: Game, n: number) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const kind of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
};

const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

describe("life moved to a target's controller", () => {
  it("gives Swords to Plowshares' life to the creature's controller, not the caster", () => {
    const game = makeGame();
    openWith(game, 2);
    // Hill Giant is a 3/3, so its controller gains 3.
    const victim = game.debugSpawn("Hill Giant", B, "battlefield");

    const aLife = game.state.players[A].life;
    const bLife = game.state.players[B].life;
    const card = game.debugSpawn("Swords to Plowshares", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "object", object: victim }],
    });
    settle(game);

    expect(game.state.zones.shared.battlefield).not.toContain(victim);
    expect(game.state.players[B].life).toBe(bLife + 3);
    expect(game.state.players[A].life).toBe(aLife);
  });

  it("charges Undermine's 3 life to the countered spell's controller", () => {
    const game = makeGame();
    openWith(game, 3);
    // B casts something on A's turn for Undermine to answer.
    const theirs = game.debugSpawn("Lightning Bolt", B, "hand");
    for (let i = 0; i < 3; i += 1) {
      const id = game.debugSpawn("Mountain", B, "battlefield");
      game.state.objects[id].tapped = false;
    }
    game.advanceUntil((s) => s.priority.holder === B || s.result.over);
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: theirs,
      targets: [{ kind: "player", player: A }],
    });

    // The caster keeps priority after casting, so wait for it to come back
    // round to A while the Bolt is still on the stack.
    game.advanceUntil(
      (s) =>
        (s.priority.holder === A && s.zones.shared.stack.length > 0) || s.result.over,
    );

    const bLife = game.state.players[B].life;
    const spell = game.state.zones.shared.stack[game.state.zones.shared.stack.length - 1];
    const card = game.debugSpawn("Undermine", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "object", object: spell }],
    });
    settle(game);

    expect(game.state.players[B].life).toBe(bLife - 3);
  });
});

describe("counting players", () => {
  it("draws one card per opponent", () => {
    const two = makeGame();
    openWith(two, 3);
    const handTwo = two.state.zones.perPlayer[A].hand.length;
    two.debugSpawn("Inspired Sphinx", A, "battlefield", { announceEntry: true });
    settle(two);
    expect(two.state.zones.perPlayer[A].hand.length).toBe(handTwo + 1);

    const four = makeGame([A, B, C]);
    openWith(four, 3);
    const handFour = four.state.zones.perPlayer[A].hand.length;
    four.debugSpawn("Inspired Sphinx", A, "battlefield", { announceEntry: true });
    settle(four);
    expect(four.state.zones.perPlayer[A].hand.length).toBe(handFour + 2);
  });
});

describe("a keyword-scoped anthem", () => {
  it("pumps only the fliers, and Empyrean Eagle spares itself", () => {
    const game = makeGame();
    openWith(game, 0);
    const eagle = game.debugSpawn("Empyrean Eagle", A, "battlefield");
    const otherFlier = game.debugSpawn("Serra Angel", A, "battlefield");
    const ground = game.debugSpawn("Hill Giant", A, "battlefield");
    // Someone else's flier isn't "yours".
    const theirs = game.debugSpawn("Serra Angel", B, "battlefield");

    expect(game.characteristics(otherFlier).power).toBe(5);
    expect(game.characteristics(ground).power).toBe(3);
    expect(game.characteristics(theirs).power).toBe(4);
    // "**Other** creatures you control with flying" — not the Eagle itself.
    expect(game.characteristics(eagle).power).toBe(2);
  });

  it("stacks with Favorable Winds, which does include the source's own kind", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Favorable Winds", A, "battlefield");
    const eagle = game.debugSpawn("Empyrean Eagle", A, "battlefield");
    expect(game.characteristics(eagle).power).toBe(3);
  });
});

describe("the tap-land cycle across colour pairs", () => {
  it("enters tapped and gains the life where printed", () => {
    const game = makeGame();
    openWith(game, 0);
    const lifeBefore = game.state.players[A].life;

    const plain = game.debugSpawn("Coastal Tower", A, "battlefield");
    expect(game.state.objects[plain].tapped).toBe(true);
    expect(game.state.players[A].life).toBe(lifeBefore);

    game.debugSpawn("Tranquil Cove", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.players[A].life).toBe(lifeBefore + 1);
  });
});
