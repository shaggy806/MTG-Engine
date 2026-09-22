import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * "Whenever … draws a card" (`TriggerSpec` `draws`), and "that player" as the
 * `"trigger-controller"` scope: Nekusar, the Mindrazer and Niv-Mizzet, Parun.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(active: PlayerId = A): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil(
    (s) =>
      s.turn.step === "precombat-main" &&
      s.turnOrder[s.turn.activePlayerIndex] === active &&
      s.priority.holder === active,
  );
  return game;
}

function spawn(game: Game, name: string, player: PlayerId): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: false });
}

/** Passes and answers until the stack is empty; every targeted trigger aims
 * at `aim`. */
function settle(game: Game, aim: PlayerId): void {
  for (let i = 0; i < 400; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "choose-targets") {
      game.dispatch({
        type: "choose-targets",
        player: awaiting.player,
        targets: [{ kind: "player", player: aim }],
      });
      continue;
    }
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind}`);
    // Triggers a debug effect queued go on the stack at the next priority.
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) {
      return;
    }
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

function hand(game: Game, player: PlayerId): number {
  return game.state.zones.perPlayer[player].hand.length;
}

describe("Nekusar, the Mindrazer", () => {
  it("an opponent draws an extra card each draw step and takes 1 per card drawn", () => {
    const game = table(A);
    spawn(game, "Nekusar, the Mindrazer", A);
    const before = hand(game, B);
    // Run to Bob's draw step and let it finish.
    game.advanceUntil(
      (s) =>
        s.turnOrder[s.turn.activePlayerIndex] === B &&
        s.turn.step === "precombat-main" &&
        s.zones.shared.stack.length === 0,
    );
    expect(hand(game, B)).toBe(before + 2);
    expect(game.state.players[B].life).toBe(20 - 2);
  });

  it("its controller draws the extra card too, and takes nothing", () => {
    const game = table(B);
    spawn(game, "Nekusar, the Mindrazer", A);
    const before = hand(game, A);
    game.advanceUntil(
      (s) =>
        s.turnOrder[s.turn.activePlayerIndex] === A &&
        s.turn.step === "precombat-main" &&
        s.zones.shared.stack.length === 0,
    );
    expect(hand(game, A)).toBe(before + 2);
    expect(game.state.players[A].life).toBe(20);
  });

  it("an empty library draws nothing, so nothing triggers", () => {
    const game = table(A);
    spawn(game, "Nekusar, the Mindrazer", A);
    game.state.zones.perPlayer[B].library = [];
    game.debugApplyEffect(B, { kind: "draw", amount: 3 });
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.players[B].attemptedDrawFromEmptyLibrary).toBe(true);
  });
});

describe("Niv-Mizzet, Parun", () => {
  it("each card you draw is 1 damage to a target you choose", () => {
    const game = table(A);
    spawn(game, "Niv-Mizzet, Parun", A);
    game.debugApplyEffect(A, { kind: "draw", amount: 3 });
    settle(game, B);
    expect(game.state.players[B].life).toBe(20 - 3);
  });

  it("an opponent's instant makes you draw, and that draw deals damage", () => {
    const game = table(A);
    spawn(game, "Niv-Mizzet, Parun", A);
    spawn(game, "Mountain", B);
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: game.debugSpawn("Lightning Bolt", B, "hand"),
      targets: [{ kind: "player", player: A }],
    });
    const before = hand(game, A);
    settle(game, B);
    expect(hand(game, A)).toBe(before + 1);
    expect(game.state.players[B].life).toBe(20 - 1);
    expect(game.state.players[A].life).toBe(20 - 3);
  });

  it("an opponent's draw doesn't trigger it", () => {
    const game = table(A);
    spawn(game, "Niv-Mizzet, Parun", A);
    game.debugApplyEffect(B, { kind: "draw", amount: 2 });
    expect(game.state.pendingTriggers).toHaveLength(0);
    expect(game.state.awaiting).toBeNull();
  });
});
