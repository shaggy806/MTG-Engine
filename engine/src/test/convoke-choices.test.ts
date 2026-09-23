import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * Convoke (rule 702.51) as a player chooses it: which creatures, with the
 * engine working out what each pays when the player doesn't say, a token
 * stack convoking token by token, and no creature both convoking and tapping
 * for mana. Scatter the Seeds is {3}{G}{G}; Saprolings are green.
 */

const A = asPlayerId("alice");
const B = asPlayerId("bob");

function mkGame(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function spawn(game: Game, name: string, player: PlayerId): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: false });
}

function stackOf(game: Game, name: string, player: PlayerId, count: number): ObjectId {
  game.debugApplyEffect(player, { kind: "create-token", token: name, count });
  const stack = game.state.zones.shared.battlefield.find(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].isToken,
  );
  if (stack === undefined || (game.state.objects[stack].stackCount ?? 1) !== count) {
    throw new Error(`expected one stack of ${count} ${name}`);
  }
  return stack;
}

type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;

function castOffer(game: Game, card: ObjectId): CastOffer | undefined {
  return game
    .legalActions(A)
    .find((a): a is CastOffer => a.kind === "cast-spell" && a.card === card);
}

const saprolings = (game: Game, tapped: boolean): number =>
  game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === "Saproling Token" && o.tapped === tapped)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);

describe("convoke, chosen by the player", () => {
  it("offers a token stack by its size, and a spell only convoke can pay for", () => {
    const game = mkGame();
    const stack = stackOf(game, "Saproling Token", A, 9);
    const seeds = game.debugSpawn("Scatter the Seeds", A, "hand");

    const convoke = castOffer(game, seeds)?.convoke;
    expect(convoke?.candidates).toEqual([stack]);
    expect(convoke?.copies).toEqual({ [stack]: 9 });
    expect(convoke?.manaAffordable).toBe(false);
    expect(convoke?.maxCreatures).toBe(5);
    // The proof leans on the stack once per pip it pays.
    expect(convoke?.proof.map((p) => p.pays)).toEqual(["G", "G", "generic", "generic", "generic"]);
  });

  it("taps five of a stack of nine, each paying what the engine picks", () => {
    const game = mkGame();
    const stack = stackOf(game, "Saproling Token", A, 9);
    const seeds = game.debugSpawn("Scatter the Seeds", A, "hand");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: seeds,
      convoke: [stack, stack, stack, stack, stack].map((creature) => ({ creature })),
    });
    expect(saprolings(game, true)).toBe(5);
    expect(saprolings(game, false)).toBe(4);
    expect(game.state.zones.shared.stack).toContain(seeds);
  });

  it("won't name a stack more times than it has tokens, or a creature with nothing to pay", () => {
    const game = mkGame();
    const stack = stackOf(game, "Saproling Token", A, 9);
    const seeds = game.debugSpawn("Scatter the Seeds", A, "hand");
    const cast = (n: number) => () =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: seeds,
        convoke: Array.from({ length: n }, () => ({ creature: stack })),
      });
    expect(cast(6)).toThrow(/nothing left to pay/);
    expect(game.state.zones.shared.stack).not.toContain(seeds);
  });

  it("says the spell is affordable without convoke when the lands can pay it", () => {
    const game = mkGame();
    stackOf(game, "Saproling Token", A, 9);
    for (const land of ["Forest", "Forest", "Forest", "Forest", "Forest"]) spawn(game, land, A);
    const seeds = game.debugSpawn("Scatter the Seeds", A, "hand");
    expect(castOffer(game, seeds)?.convoke?.manaAffordable).toBe(true);
  });
});

describe("a creature can't both convoke and tap for mana", () => {
  // {3}{G}{G} with three lands and Llanowar Elves: the Elves convoking pay a
  // {G}, leaving {3}{G} for three lands — one short. It used to go through,
  // because the auto-payer tapped the convoking Elves for a {G} as well.
  it("refuses a cast that only pays by using one creature twice", () => {
    const game = mkGame();
    const elves = spawn(game, "Llanowar Elves", A);
    for (const land of ["Forest", "Forest", "Plains"]) spawn(game, land, A);
    const seeds = game.debugSpawn("Scatter the Seeds", A, "hand");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: seeds, convoke: [{ creature: elves }] }),
    ).toThrow(/cannot pay/);
  });

  it("pays the rest from lands when there are enough", () => {
    const game = mkGame();
    const elves = spawn(game, "Llanowar Elves", A);
    const lands = ["Forest", "Forest", "Plains", "Plains"].map((land) => spawn(game, land, A));
    const seeds = game.debugSpawn("Scatter the Seeds", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: seeds, convoke: [{ creature: elves }] });
    expect(game.state.objects[elves].tapped).toBe(true);
    expect(lands.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(game.state.players[A].manaPool).toEqual([]);
  });

  it("builds its proof from creatures that don't make mana first", () => {
    const game = mkGame();
    const elves = spawn(game, "Llanowar Elves", A);
    const bears = spawn(game, "Grizzly Bears", A);
    for (const land of ["Forest", "Forest", "Forest"]) spawn(game, land, A);
    const seeds = game.debugSpawn("Scatter the Seeds", A, "hand");
    const convoke = castOffer(game, seeds)?.convoke;
    expect(convoke?.candidates).toEqual([bears, elves]);
    // Three lands and the Elves' mana are four; the spell needs five, so it
    // takes both creatures convoking — which the proof finds.
    expect(convoke?.manaAffordable).toBe(false);
    expect(convoke?.proof.map((p) => p.creature)).toEqual([bears, elves]);
  });
});
