import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * Three small features off the top-commanders triage, each with the commander
 * that needed it: the `monarch` condition (Queen Marchesa), `nthEachTurn` on a
 * cast trigger (Kraum, Ludevic's Opus), and the `plays-land` trigger plus the
 * `hand-size` condition (Flubs, the Fool).
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function spawn(game: Game, name: string, player: PlayerId): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: false });
}

function tokens(game: Game, name: string, player: PlayerId): number {
  return game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === name && o.controller === player)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
}

/** Passes until the stack and the trigger queue are empty, discarding the
 * first card of a hand whenever a discard is asked for. */
function settle(game: Game): void {
  for (let i = 0; i < 200; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "discard") {
      game.dispatch({
        type: "discard",
        player: awaiting.player,
        cards: game.state.zones.perPlayer[awaiting.player].hand.slice(0, awaiting.count),
      });
      continue;
    }
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind}`);
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) return;
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

function hand(game: Game, player: PlayerId): ObjectId[] {
  return game.state.zones.perPlayer[player].hand;
}

describe("Queen Marchesa", () => {
  it("entering makes you the monarch", () => {
    const game = table();
    game.debugSpawn("Queen Marchesa", A, "battlefield", { summoningSick: false, announceEntry: true });
    settle(game);
    expect(game.state.monarch).toBe(A);
  });

  it("an Assassin each of your upkeeps while an opponent is the monarch, none while you are", () => {
    const game = table();
    spawn(game, "Queen Marchesa", A);
    game.state.monarch = B;
    game.advanceUntil(
      (s) => s.turnOrder[s.turn.activePlayerIndex] === A && s.turn.step === "draw",
    );
    expect(tokens(game, "Assassin Token", A)).toBe(1);

    game.state.monarch = A;
    game.advanceUntil(
      (s) => s.turnOrder[s.turn.activePlayerIndex] === B && s.turn.step === "draw",
    );
    game.advanceUntil(
      (s) => s.turnOrder[s.turn.activePlayerIndex] === A && s.turn.step === "draw",
    );
    expect(tokens(game, "Assassin Token", A)).toBe(1);
  });
});

describe("Kraum, Ludevic's Opus", () => {
  it("draws on an opponent's second spell each turn, not their first or third", () => {
    const game = table();
    spawn(game, "Kraum, Ludevic's Opus", A);
    for (let i = 0; i < 3; i += 1) spawn(game, "Mountain", B);
    const before = hand(game, A).length;
    game.dispatch({ type: "pass-priority", player: A });
    for (let spell = 1; spell <= 3; spell += 1) {
      game.dispatch({
        type: "cast-spell",
        player: B,
        card: game.debugSpawn("Lightning Bolt", B, "hand"),
        targets: [{ kind: "player", player: A }],
      });
      settle(game);
      expect(hand(game, A).length).toBe(before + (spell >= 2 ? 1 : 0));
      if (game.state.priority.holder === A) game.dispatch({ type: "pass-priority", player: A });
    }
  });

  it("doesn't draw on your own second spell", () => {
    const game = table();
    spawn(game, "Kraum, Ludevic's Opus", A);
    for (let i = 0; i < 2; i += 1) spawn(game, "Mountain", A);
    const before = hand(game, A).length;
    for (let spell = 0; spell < 2; spell += 1) {
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: game.debugSpawn("Lightning Bolt", A, "hand"),
        targets: [{ kind: "player", player: B }],
      });
      settle(game);
    }
    expect(hand(game, A).length).toBe(before);
  });
});

describe("Flubs, the Fool", () => {
  it("playing a land with cards in hand discards; with none it draws", () => {
    const game = table();
    spawn(game, "Flubs, the Fool", A);
    const first = hand(game, A).find((id) => game.state.objects[id].cardName === "Mountain");
    if (first === undefined) throw new Error("no land in hand");
    const before = hand(game, A).length;
    game.dispatch({ type: "play-land", player: A, card: first });
    settle(game);
    // Played one, discarded one.
    expect(hand(game, A).length).toBe(before - 2);

    // The additional land drop, from an empty hand: draws.
    game.state.zones.perPlayer[A].hand = [];
    const last = game.debugSpawn("Mountain", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: last });
    settle(game);
    expect(hand(game, A).length).toBe(1);
  });

  it("casting a spell rummages too, but Flubs' own cast doesn't", () => {
    const game = table();
    for (let i = 0; i < 4; i += 1) spawn(game, "Mountain", A);
    for (const c of ["Forest", "Island"]) spawn(game, c, A);
    const flubs = game.debugSpawn("Flubs, the Fool", A, "hand");
    const before = hand(game, A).length;
    game.dispatch({ type: "cast-spell", player: A, card: flubs, targets: [] });
    settle(game);
    expect(game.state.objects[flubs].zone).toBe("battlefield");
    expect(hand(game, A).length).toBe(before - 1);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Lightning Bolt", A, "hand"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(hand(game, A).length).toBe(before - 2);
  });

  it("a land an effect puts onto the battlefield wasn't played", () => {
    const game = table();
    spawn(game, "Flubs, the Fool", A);
    const before = hand(game, A).length;
    game.debugSpawn("Mountain", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(hand(game, A).length).toBe(before);
  });
});
