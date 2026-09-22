import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Two seats, 40 Forests apiece, land drops uncapped so a turn can drop two.
 * `startingPlayer` defaults to `turnOrder[0]`, so Alice is always on the play. */
const mkGame = () => {
  const controllers = {
    [A]: new ScriptedController(A),
    [B]: new ScriptedController(B),
  };
  return Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: [A, B].map((p) => ({ player: p, cards: Array(40).fill("Forest") })),
  });
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;

const firstHandLand = (game: Game, player = A): ObjectId => {
  const id = game
    .handOf(player)
    .find((c) => game.state.objects[c].cardName === "Forest");
  if (id === undefined) throw new Error("no land in hand");
  return id;
};

describe("Tatyova, Benthic Druid — landfall draw + life", () => {
  it("gains 1 life and draws a card when a land you control enters", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Tatyova, Benthic Druid", A, "battlefield");

    const life = game.state.players[A].life;
    const hand = game.handOf(A).length;
    const library = game.libraryOf(A).length;

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil(quiet);

    expect(game.state.players[A].life).toBe(life + 1);
    // One card left the hand as the land, one arrived from the draw.
    expect(game.handOf(A).length).toBe(hand);
    expect(game.libraryOf(A).length).toBe(library - 1);
  });

  it("triggers once per land, so two drops draw two and gain two", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Tatyova, Benthic Druid", A, "battlefield");

    const life = game.state.players[A].life;
    const library = game.libraryOf(A).length;

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil(quiet);
    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil(quiet);

    expect(game.state.players[A].life).toBe(life + 2);
    expect(game.libraryOf(A).length).toBe(library - 2);
  });

  it("fires for a land put onto the battlefield rather than played", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Tatyova, Benthic Druid", A, "battlefield");

    const life = game.state.players[A].life;
    const hand = game.handOf(A).length;

    // Landfall is a zone-change trigger (rule 603.2): "enters", not "plays".
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);

    expect(game.state.players[A].life).toBe(life + 1);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("fires on an opponent's turn — the clause is 'you control', not 'your turn'", () => {
    const game = mkGame();
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.activePlayer).toBe(B);
    game.debugSpawn("Tatyova, Benthic Druid", A, "battlefield");

    const life = game.state.players[A].life;
    const hand = game.handOf(A).length;

    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);

    expect(game.state.players[A].life).toBe(life + 1);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  // ---- negative cases -------------------------------------------------

  it("does NOT trigger on a land an opponent controls", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Tatyova, Benthic Druid", A, "battlefield");

    const aLife = game.state.players[A].life;
    const aHand = game.handOf(A).length;
    const bLife = game.state.players[B].life;
    const bHand = game.handOf(B).length;

    game.debugSpawn("Forest", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);

    expect(game.state.players[A].life).toBe(aLife);
    expect(game.handOf(A).length).toBe(aHand);
    // ...and Tatyova's controller is the one who'd benefit, so Bob gets nothing either.
    expect(game.state.players[B].life).toBe(bLife);
    expect(game.handOf(B).length).toBe(bHand);
  });

  it("does NOT trigger on a nonland permanent entering under your control", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Tatyova, Benthic Druid", A, "battlefield");

    const life = game.state.players[A].life;
    const hand = game.handOf(A).length;

    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);

    expect(game.state.players[A].life).toBe(life);
    expect(game.handOf(A).length).toBe(hand);
  });

  it("does NOT trigger for a land that entered before Tatyova did", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);

    const life = game.state.players[A].life;
    const hand = game.handOf(A).length;

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil(quiet);
    game.debugSpawn("Tatyova, Benthic Druid", A, "battlefield");
    game.advanceUntil(quiet);

    expect(game.state.players[A].life).toBe(life);
    // The land left the hand and nothing replaced it.
    expect(game.handOf(A).length).toBe(hand - 1);
  });
});
