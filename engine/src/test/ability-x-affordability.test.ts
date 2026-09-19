/**
 * `legalActions`' advertised `maxX` for an activated ability has to match what
 * `activateAbility` can actually pay.
 *
 * The two diverged for `{X}…{T}` abilities: paying excludes the source (it's
 * tapped for the `{T}`, rule 602.2a, so it can't also be tapped for mana),
 * but the `maxX` computation only *avoided* it — a preference, not a rule —
 * and so counted the source's own mana toward X. The 4-player fuzzer hit it
 * on Kessig Wolf Run (`{X}{R}, {T}: …` on a land that taps for mana itself):
 * `legalActions` offered an X that `dispatch` then refused with
 * "cannot pay for Kessig Wolf Run's ability".
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Kessig Wolf Run enters tapped, and `debugSpawn` goes through the real
 * `moveObject`, so untap it before asking what it can pay for. */
const spawnUntapped = (game: Game, name: string) => {
  const id = game.debugSpawn(name, A, "battlefield");
  game.state.objects[id].tapped = false;
  return id;
};

/** Kessig Wolf Run has two activated abilities and the first is its mana
 * ability (`{T}: Add {C}`) — match on the one that actually has an `{X}`. */
const findWolfRunPump = (game: Game) => {
  for (const action of game.legalActions(A)) {
    if (
      action.kind === "activate-ability" &&
      action.cardName === "Kessig Wolf Run" &&
      action.xCost !== undefined
    ) {
      return action;
    }
  }
  return undefined;
};

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });

describe("activated-ability {X} affordability", () => {
  it("does not count a {T}-cost source's own mana toward maxX", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");

    // Kessig Wolf Run's ability costs `{X}{R}{G}, {T}`. With two Mountains and
    // a Forest untapped the fixed part eats two of them, leaving X = 1. The
    // Wolf Run taps for the {T} so its own `{T}: Add {C}` can't help —
    // counting it is exactly the bug, and would advertise X = 2.
    spawnUntapped(game, "Kessig Wolf Run");
    for (let i = 0; i < 2; i += 1) spawnUntapped(game, "Mountain");
    spawnUntapped(game, "Forest");
    game.debugSpawn("Grizzly Bears", A, "battlefield");

    const legal = findWolfRunPump(game);
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "activate-ability") return;
    expect(legal.xCost).toBeDefined();
    expect(legal.xCost?.maxX).toBe(1);
  });

  it("every advertised maxX is actually payable", () => {
    // The general form of the invariant the fuzzer was asserting by accident:
    // whatever `legalActions` says X can be, `dispatch` must accept.
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    spawnUntapped(game, "Kessig Wolf Run");
    for (let i = 0; i < 5; i += 1) spawnUntapped(game, "Mountain");
    for (let i = 0; i < 3; i += 1) spawnUntapped(game, "Forest");
    const creature = game.debugSpawn("Grizzly Bears", A, "battlefield");

    const legal = findWolfRunPump(game);
    if (legal === undefined) return;
    const maxX = legal.xCost?.maxX ?? 0;
    expect(maxX).toBeGreaterThan(0);

    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: legal.source,
        abilityIndex: legal.abilityIndex,
        targets: [{ kind: "object", object: creature }],
        xValue: maxX,
      }),
    ).not.toThrow();
  });
});
