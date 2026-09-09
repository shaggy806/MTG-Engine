import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const mkGame = (players: readonly (typeof A)[] = [A, B]) => {
  const controllers = Object.fromEntries(
    players.map((p) => [p, new ScriptedController(p)]),
  );
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((p) => ({ player: p, cards: Array(40).fill("Forest") })),
  });
  return game;
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const firstHandLand = (game: Game): ObjectId => {
  const id = game.handOf(A).find((c) => game.state.objects[c].cardName === "Forest");
  if (id === undefined) throw new Error("no land in hand");
  return id;
};

describe("Tireless Provisioner — landfall create-token (modal)", () => {
  it("offers Food-or-Treasure on a land drop and mints the chosen token", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Tireless Provisioner", A, "battlefield");

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting).toMatchObject({ kind: "choose-modes", player: A });

    game.dispatch({ type: "choose-modes", player: A, modes: [1] }); // Treasure
    game.advanceUntil(quiet);

    const treasures = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Treasure Token",
    );
    expect(treasures).toHaveLength(1);
    expect(game.state.objects[treasures[0]].isToken).toBe(true);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Food Token"),
    ).toBe(false);
  });
});

describe("Lotus Cobra — landfall add one mana of any color", () => {
  it("adds mana of the chosen colour to the pool", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Lotus Cobra", A, "battlefield");

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [3] }); // Add {R}
    game.advanceUntil(quiet);

    expect(game.state.players[A].manaPool.R).toBe(1);
    expect(game.state.players[A].manaPool.G).toBe(0);
  });
});

describe("Iridescent Vinelasher — landfall ping to an opponent", () => {
  it("deals 1 to the sole opponent with no decision (forced target)", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Iridescent Vinelasher", A, "battlefield");
    const bLife = game.state.players[B].life;

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil(quiet);

    expect(game.state.players[B].life).toBe(bLife - 1);
  });

  it("raises a choose-targets decision when there are two opponents", () => {
    const game = mkGame([A, B, C]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Iridescent Vinelasher", A, "battlefield");

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil((s) => s.awaiting !== null);
    expect(game.state.awaiting).toMatchObject({ kind: "choose-targets", source: expect.anything() });
    const opts = (game.state.awaiting as { options: readonly (readonly unknown[])[] }).options[0];
    // both opponents are offered, alice herself is not
    expect(opts).toHaveLength(2);
  });
});
