import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

// "Whenever one or more … enter" (`enters-battlefield` with `batched`): once
// per simultaneous entry however many of its permanents match (rule 603.2c),
// with "that much" counting them — Marneus Calgar, Ingenious Artillerist.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil(
    (s) => s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0 && s.awaiting === null,
  );
const handSize = (game: Game) => game.state.zones.perPlayer[A].hand.length;

describe("batched enters-battlefield triggers", () => {
  it("Marneus Calgar draws once for tokens entering together, once per separate entry", () => {
    const { game } = mkGame();
    game.debugSpawn("Marneus Calgar", A, "battlefield");
    const before = handSize(game);
    game.debugApplyEffect(A, { kind: "create-token", token: "Astartes Warrior Token", count: 2 });
    quiet(game);
    expect(handSize(game)).toBe(before + 1);
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    quiet(game);
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    quiet(game);
    expect(handSize(game)).toBe(before + 3);
  });

  it("a compacted token stack is one entry too", () => {
    const { game } = mkGame();
    game.debugSpawn("Marneus Calgar", A, "battlefield");
    const before = handSize(game);
    game.debugApplyEffect(A, { kind: "create-token", token: "Servo Token", count: 20 });
    quiet(game);
    expect(game.battlefield.filter((id) => game.state.objects[id].stackCount === 20)).toHaveLength(1);
    expect(handSize(game)).toBe(before + 1);
  });

  it("nontoken entries and an opponent's tokens don't trigger Marneus", () => {
    const { game } = mkGame();
    game.debugSpawn("Marneus Calgar", A, "battlefield");
    const before = handSize(game);
    game.debugApplyEffect(B, { kind: "create-token", token: "Treasure Token", count: 2 });
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    quiet(game);
    expect(handSize(game)).toBe(before);
  });

  it("Ingenious Artillerist deals damage equal to how many artifacts entered", () => {
    const { game } = mkGame();
    game.debugSpawn("Ingenious Artillerist", A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 3 });
    quiet(game);
    expect(game.state.players[B].life).toBe(37);
    // Twenty at once are one compacted stack: still that much, once.
    game.debugApplyEffect(A, { kind: "create-token", token: "Servo Token", count: 20 });
    quiet(game);
    expect(game.state.players[B].life).toBe(17);
    // Creatures in the same entry don't count.
    game.debugApplyEffect(A, { kind: "create-token", token: "Astartes Warrior Token", count: 2 });
    quiet(game);
    expect(game.state.players[B].life).toBe(17);
  });

  it("Chapter Master's two tokens draw one card", () => {
    const { game } = mkGame();
    const marneus = game.debugSpawn("Marneus Calgar", A, "battlefield");
    for (let i = 0; i < 6; i++) game.debugSpawn("Plains", A, "battlefield");
    const before = handSize(game);
    game.dispatch({ type: "activate-ability", player: A, source: marneus, abilityIndex: 0, targets: [] });
    quiet(game);
    const warriors = game.battlefield.filter((id) => game.state.objects[id].cardName === "Astartes Warrior Token");
    expect(warriors.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    expect(handSize(game)).toBe(before + 1);
  });
});
