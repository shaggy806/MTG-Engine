/**
 * `StaticAbility.castFromGraveyard` — a permanent granting permission to cast
 * spells from your graveyard for their normal cost (Gisa and Geralf).
 *
 * Distinct from flashback on three counts, each tested here: the permission
 * belongs to the *grantor* rather than the card, it can be limited to once per
 * turn and to your own turn, and nothing exiles the spell afterwards.
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
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });

const openWith = (game: Game, n: number) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const kind of ["Swamp", "Island"]) {
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

const graveyardCasts = (game: Game) =>
  game
    .legalActions(A)
    .filter((a) => a.kind === "cast-spell" && a.via === "graveyard-permission");

describe("Gisa and Geralf's graveyard permission", () => {
  it("offers a Zombie creature in your graveyard, and nothing else", () => {
    const game = makeGame();
    openWith(game, 4);
    game.debugSpawn("Gisa and Geralf", A, "battlefield");
    const zombie = game.debugSpawn("Vengeful Dead", A, "graveyard");
    // A non-Zombie creature, and a Zombie in someone else's graveyard.
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Vengeful Dead", B, "graveyard");

    const offered = graveyardCasts(game);
    expect(offered.map((a) => (a.kind === "cast-spell" ? a.card : null))).toEqual([zombie]);
  });

  it("is gone the moment Gisa and Geralf leaves", () => {
    const game = makeGame();
    openWith(game, 4);
    const gisa = game.debugSpawn("Gisa and Geralf", A, "battlefield");
    game.debugSpawn("Vengeful Dead", A, "graveyard");
    expect(graveyardCasts(game).length).toBe(1);

    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: gisa },
    ]);
    settle(game);
    expect(graveyardCasts(game).length).toBe(0);
  });

  it("works once per turn, then again next turn", () => {
    const game = makeGame();
    openWith(game, 8);
    game.debugSpawn("Gisa and Geralf", A, "battlefield");
    const first = game.debugSpawn("Vengeful Dead", A, "graveyard");
    game.debugSpawn("Vengeful Dead", A, "graveyard");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: first,
      targets: [],
      via: "graveyard-permission",
    });
    settle(game);
    expect(game.state.objects[first].zone).toBe("battlefield");
    // The second Zombie is still there, but the permission is spent.
    expect(graveyardCasts(game).length).toBe(0);

    // Round the table back to A's next main phase.
    const turn = game.state.turn.number;
    game.advanceUntil(
      (s) =>
        (s.turn.number > turn + 1 && s.priority.holder === A && s.turn.step === "precombat-main") ||
        s.result.over,
    );
    for (let i = 0; i < 4; i += 1) {
      const id = game.debugSpawn("Swamp", A, "battlefield");
      game.state.objects[id].tapped = false;
    }
    expect(graveyardCasts(game).length).toBe(1);
  });

  it("isn't offered on an opponent's turn", () => {
    const game = makeGame();
    openWith(game, 4);
    game.debugSpawn("Gisa and Geralf", A, "battlefield");
    game.debugSpawn("Vengeful Dead", A, "graveyard");

    game.advanceUntil((s) => s.priority.holder === A && s.turn.number === 2 || s.result.over);
    expect(game.state.turn.number).toBe(2);
    expect(graveyardCasts(game).length).toBe(0);
  });

  it("sends a countered Zombie back to the graveyard, not to exile", () => {
    const game = makeGame();
    openWith(game, 4);
    game.debugSpawn("Gisa and Geralf", A, "battlefield");
    const zombie = game.debugSpawn("Vengeful Dead", A, "graveyard");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: zombie,
      targets: [],
      via: "graveyard-permission",
    });
    expect(game.state.objects[zombie].zone).toBe("stack");

    game.debugApplyEffect(B, { kind: "counter", target: 0 }, [
      { kind: "object", object: zombie },
    ]);
    // Flashback would exile it here; this permission doesn't.
    expect(game.state.objects[zombie].zone).toBe("graveyard");
  });
});
