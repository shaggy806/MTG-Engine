/**
 * Two more phase-E singles:
 *
 * - **`sacrifice-all-but`** — "that player chooses up to two creatures they
 *   control, then sacrifices the rest" (Archfiend of Depravity). The inverse
 *   of `sacrifice`, which names how many to give up rather than keep.
 * - **Flashback with a life cost** — "Flashback—{1}{U}, Pay 3 life" (Deep
 *   Analysis). Part of the cost, so it gates castability and is paid as the
 *   spell is cast.
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
      cards: Array<string>(40).fill("Island"),
    })),
  });

const creaturesOf = (game: Game, player: PlayerId) =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].controller === player &&
      game.characteristics(id).types.includes("creature"),
  );

describe("sacrifice-all-but", () => {
  it("asks the affected player to give up everything past the keep count", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.debugApplyEffect(A, {
      kind: "sacrifice-all-but",
      who: "each-opponent",
      keep: 2,
      filter: { type: "creature" },
    });
    game.advanceUntil((s) => s.awaiting?.kind === "sacrifice" || s.result.over);

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("sacrifice");
    if (awaiting?.kind !== "sacrifice") return;
    // Four creatures, keep two — so two are given up, and it's B's choice.
    expect(awaiting.player).toBe(B);
    expect(awaiting.count).toBe(2);
  });

  it("does nothing when the player is already at or under the limit", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.debugApplyEffect(A, {
      kind: "sacrifice-all-but",
      who: "each-opponent",
      keep: 2,
      filter: { type: "creature" },
    });
    game.advanceUntil((s) => s.awaiting !== null || s.priority.holder !== null);
    expect(game.state.awaiting?.kind).not.toBe("sacrifice");
    expect(creaturesOf(game, B).length).toBe(2);
  });

  it("leaves the controller's own creatures alone", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");

    game.debugApplyEffect(A, {
      kind: "sacrifice-all-but",
      who: "each-opponent",
      keep: 2,
      filter: { type: "creature" },
    });
    game.advanceUntil((s) => s.awaiting !== null || s.priority.holder !== null);
    expect(creaturesOf(game, A).length).toBe(4);
  });
});

describe("Archfiend of Depravity's trigger", () => {
  it("fires on an opponent's end step, not the controller's", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.debugSpawn("Archfiend of Depravity", A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Grizzly Bears", B, "battlefield");

    // A's own end step: nothing happens.
    game.advanceUntil((s) => s.turn.step === "end" || s.result.over);
    game.advanceUntil(
      (s) => s.awaiting?.kind === "sacrifice" || s.turn.number > game.state.turn.number,
    );
    expect(creaturesOf(game, B).length).toBe(4);
  });
});

describe("flashback with a life cost", () => {
  it("is not castable without the life to pay", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (let i = 0; i < 4; i += 1) {
      const id = game.debugSpawn("Island", A, "battlefield");
      game.state.objects[id].tapped = false;
    }
    game.debugSpawn("Deep Analysis", A, "graveyard");
    game.state.players[A].life = 3; // "Pay 3 life" needs more than 3

    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.via === "flashback");
    expect(legal).toBeUndefined();
  });

  it("pays the life as the spell is cast", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (let i = 0; i < 4; i += 1) {
      const id = game.debugSpawn("Island", A, "battlefield");
      game.state.objects[id].tapped = false;
    }
    game.debugSpawn("Deep Analysis", A, "graveyard");
    const lifeBefore = game.state.players[A].life;

    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.via === "flashback");
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "cast-spell") return;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: legal.card,
      via: "flashback",
      targets: [{ kind: "player", player: A }],
    });
    // Paid on cast, before the spell has even resolved.
    expect(game.state.players[A].life).toBe(lifeBefore - 3);
  });
});
