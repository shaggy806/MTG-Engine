/**
 * Winning and losing by effect (rules 104.2b, 104.3e), and the effects that
 * stop either:
 *
 * - `win-game` ends the game at once with its controller the winner (104.1)
 *   — in a multiplayer game too — unless they can't win;
 * - `lose-game` makes players lose and leave at once (104.5, 800.4a), the
 *   last one left winning (104.2a), unless they can't lose;
 * - "you can't lose the game" (a static — Platinum Angel — or a turn's
 *   `player-effect` — Angel's Grace) holds off every state-based loss and
 *   every effect that says so, until it ends; conceding still loses;
 * - "your opponents can't win the game" stops a win but never the last
 *   player standing;
 * - Laboratory Maniac's replacement of a draw from an empty library, which
 *   replaces it even for a player who can't win (the rulings);
 * - a damage life floor (Angel's Grace) and "can't lose life" (rule 119.8 —
 *   Everybody Lives!), which also makes life unpayable.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

// A test-only "you lose the game" and "each opponent loses the game".
const DOOM = defineCard({
  name: "Test Doom",
  manaCost: "{0}",
  colors: [],
  types: ["sorcery"],
  text: "You lose the game.",
  effect: { kind: "lose-game" },
});
const registry = createDefaultRegistry().register(DOOM);

const makeGame = (players: readonly PlayerId[], cards: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({
      player,
      cards: [...(player === A ? cards : []), ...Array<string>(40).fill("Plains")],
    })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("win-game", () => {
  it("ends the game at once with its controller the winner, in multiplayer too", () => {
    const game = makeGame([A, B, C]);
    game.debugApplyEffect(B, { kind: "win-game" });
    expect(game.state.result).toMatchObject({ over: true, winner: B });
    // Nobody else lost: the game simply ended (rule 104.1).
    expect(game.state.players[A].hasLost).toBe(false);
    expect(game.state.players[C].hasLost).toBe(false);
    expect(game.state.priority.holder).toBe(null);
    expect(game.legalActions(A)).toEqual([]);
  });

  it("stops the rest of the resolution once the game is over", () => {
    const game = makeGame([A, B]);
    const before = game.state.players[A].life;
    game.debugApplyEffect(A, {
      kind: "sequence",
      effects: [{ kind: "win-game" }, { kind: "lose-life", amount: 5, who: "you" }],
    });
    expect(game.state.result.winner).toBe(A);
    expect(game.state.players[A].life).toBe(before);
  });

  it("does nothing for a player an opponent's Platinum Angel says can't win", () => {
    const game = makeGame([A, B]);
    game.debugSpawn("Platinum Angel", B, "battlefield");
    game.debugApplyEffect(A, { kind: "win-game" });
    expect(game.state.result.over).toBe(false);
    // Their own Angel doesn't stop them.
    const own = makeGame([A, B]);
    own.debugSpawn("Platinum Angel", A, "battlefield");
    own.debugApplyEffect(A, { kind: "win-game" });
    expect(own.state.result.winner).toBe(A);
  });
});

describe("lose-game", () => {
  it("makes the player lose and leave; the last one left wins (rule 104.2a)", () => {
    const game = makeGame([A, B]);
    game.debugApplyEffect(A, { kind: "lose-game" });
    expect(game.state.players[A].hasLost).toBe(true);
    expect(game.state.result).toMatchObject({ over: true, winner: B, reason: "last player remaining" });
  });

  it("players a scope names lose together, the one left winning", () => {
    const game = makeGame([A, B, C]);
    game.debugApplyEffect(A, { kind: "lose-game", who: "each-opponent" });
    expect(game.state.players[B].hasLost).toBe(true);
    expect(game.state.players[C].hasLost).toBe(true);
    // Both lost at once, leaving Alice.
    expect(game.state.result).toMatchObject({ over: true, winner: A });
  });

  it("is a draw when every player left loses at once (rule 104.4a)", () => {
    const game = makeGame([A, B]);
    game.debugApplyEffect(A, { kind: "lose-game", who: "each-player" });
    expect(game.state.result).toMatchObject({ over: true, winner: null });
  });

  it("a spell saying so, cast and resolved", () => {
    const game = makeGame([A, B], ["Test Doom"]);
    const doom = game.handOf(A).find((id) => game.state.objects[id].cardName === "Test Doom");
    if (doom === undefined) throw new Error("no Test Doom in hand");
    game.dispatch({ type: "cast-spell", player: A, card: doom });
    game.advanceUntil((s) => quiet(s) || s.result.over);
    expect(game.state.players[A].lossReason).toBe("lost the game to Test Doom");
    expect(game.state.result.winner).toBe(B);
  });
});

describe("can't lose the game", () => {
  it("holds off every state-based loss while Platinum Angel stays; the loss comes once it's gone", () => {
    const game = makeGame([A, B]);
    const angel = game.debugSpawn("Platinum Angel", A, "battlefield");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 25, who: "you" });
    game.debugApplyEffect(B, { kind: "add-player-counters", counter: "poison", amount: 10, who: "each-opponent" });
    // Through several checks (every step's priority).
    game.advanceUntil((s) => s.turn.step === "end" || s.result.over);
    expect(game.state.result.over).toBe(false);
    expect(game.state.players[A].hasLost).toBe(false);
    expect(game.state.players[A].life).toBeLessThanOrEqual(0);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: angel }]);
    game.advanceUntil((s) => s.result.over || s.turn.number > 3);
    expect(game.state.players[A].hasLost).toBe(true);
    expect(game.state.result.winner).toBe(B);
  });

  it("stops an effect that says they lose — and its opponents' wins — but not a concession", () => {
    const game = makeGame([A, B]);
    game.debugSpawn("Platinum Angel", A, "battlefield");
    game.debugApplyEffect(A, { kind: "lose-game" });
    expect(game.state.players[A].hasLost).toBe(false);
    game.debugApplyEffect(B, { kind: "win-game" });
    expect(game.state.result.over).toBe(false);
    game.concede(A);
    expect(game.state.players[A].hasLost).toBe(true);
    expect(game.state.result.winner).toBe(B);
  });

  it("a draw from an empty library isn't a loss while it lasts, nor after (rule 704.5b)", () => {
    const game = makeGame([A, B]);
    const angel = game.debugSpawn("Platinum Angel", A, "battlefield");
    game.state.zones.perPlayer[A].library = [];
    // Alice's next draw step: the draw finds nothing, and the check after it
    // finds the Angel.
    game.advanceUntil(
      (s) => (s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A) || s.result.over,
    );
    expect(game.eventsOfType("draw-from-empty-library").some((e) => e.player === A)).toBe(true);
    expect(game.state.players[A].hasLost).toBe(false);
    // That attempt belonged to that check: the Angel leaving later doesn't
    // reach back for it.
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: angel }]);
    game.advanceUntil((s) => (s.turn.number === 3 && s.turn.step === "end") || s.result.over);
    expect(game.state.players[A].hasLost).toBe(false);
  });

  it("a player-effect lasts the turn: Angel's Grace holds 0 life until cleanup", () => {
    const game = makeGame([A, B]);
    game.debugApplyEffect(A, {
      kind: "player-effect",
      duration: "end-of-turn",
      cantLoseGame: "you",
      cantWinGame: "each-opponent",
    });
    game.debugApplyEffect(A, { kind: "lose-life", amount: 30, who: "you" });
    game.debugApplyEffect(B, { kind: "win-game" });
    expect(game.state.result.over).toBe(false);
    game.dispatch({ type: "pass-priority", player: A });
    expect(game.state.players[A].hasLost).toBe(false);
    game.advanceUntil((s) => s.result.over || s.turn.number > 1);
    expect(game.state.players[A].hasLost).toBe(true);
    // Lost in the cleanup step, before the next turn began.
    expect(game.state.turn.number).toBe(1);
  });
});

describe("Laboratory Maniac's replacement", () => {
  it("wins instead of drawing from an empty library", () => {
    const game = makeGame([A, B]);
    game.debugSpawn("Laboratory Maniac", A, "battlefield");
    game.state.zones.perPlayer[A].library = [];
    game.debugApplyEffect(A, { kind: "draw", amount: 3 });
    expect(game.state.result).toMatchObject({ over: true, winner: A, reason: "won the game with Laboratory Maniac" });
  });

  it("leaves a draw from a library with cards alone", () => {
    const game = makeGame([A, B]);
    game.debugSpawn("Laboratory Maniac", A, "battlefield");
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    expect(game.state.result.over).toBe(false);
  });

  it("still replaces the draw when they can't win: no win, and no loss for it", () => {
    const game = makeGame([A, B]);
    game.debugSpawn("Laboratory Maniac", A, "battlefield");
    game.debugSpawn("Platinum Angel", B, "battlefield");
    game.state.zones.perPlayer[A].library = [];
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    game.dispatch({ type: "pass-priority", player: A });
    expect(game.state.result.over).toBe(false);
    expect(game.state.players[A].hasLost).toBe(false);
  });

  it("replaces the draw an opponent's draw becomes under its controller's own Notion Thief (rule 616.2)", () => {
    const game = makeGame([A, B]);
    game.debugSpawn("Laboratory Maniac", A, "battlefield");
    game.debugSpawn("Notion Thief", A, "battlefield");
    game.state.zones.perPlayer[A].library = [];
    // Bob's draw becomes Alice's, from her empty library: she wins instead.
    game.debugApplyEffect(B, { kind: "draw", amount: 2 });
    expect(game.state.result).toMatchObject({ over: true, winner: A, reason: "won the game with Laboratory Maniac" });
    expect(game.state.players[A].attemptedDrawFromEmptyLibrary).not.toBe(true);
  });

  it("is applied before an opponent's Notion Thief redirect", () => {
    const game = makeGame([A, B]);
    game.debugSpawn("Laboratory Maniac", A, "battlefield");
    game.debugSpawn("Notion Thief", B, "battlefield");
    game.state.zones.perPlayer[A].library = [];
    const bHand = game.handOf(B).length;
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    expect(game.state.result.winner).toBe(A);
    expect(game.handOf(B).length).toBe(bHand);
  });
});

describe("damage life floor", () => {
  it("damage that would take them below the floor leaves them at it; lifelink still gains in full", () => {
    const game = makeGame([A, B]);
    game.debugApplyEffect(A, {
      kind: "player-effect",
      duration: "end-of-turn",
      damageLifeFloor: { who: "you", floor: 1 },
    });
    const start = game.state.players[A].life;
    game.debugApplyEffect(B, { kind: "damage", who: "each-opponent", amount: start + 5 });
    expect(game.state.players[A].life).toBe(1);
    // More damage at 1 changes nothing.
    game.debugApplyEffect(B, { kind: "damage", who: "each-opponent", amount: 3 });
    expect(game.state.players[A].life).toBe(1);
    // Life *lost* isn't damage, and goes below.
    game.debugApplyEffect(A, { kind: "lose-life", amount: 2, who: "you" });
    expect(game.state.players[A].life).toBe(-1);
    // Below the floor, damage lowers it as normal (the ruling).
    game.debugApplyEffect(B, { kind: "damage", who: "each-opponent", amount: 2 });
    expect(game.state.players[A].life).toBe(-3);
  });
});

describe("can't lose life (rule 119.8)", () => {
  const everybody = (game: Game) =>
    game.debugApplyEffect(A, {
      kind: "player-effect",
      duration: "end-of-turn",
      cantLoseLife: "each-player",
    });

  it("damage and life loss change nothing; gains still happen", () => {
    const game = makeGame([A, B]);
    everybody(game);
    const life = game.state.players[B].life;
    game.debugApplyEffect(A, { kind: "damage", who: "each-opponent", amount: 5 });
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, who: "each-opponent" });
    expect(game.state.players[B].life).toBe(life);
    game.debugApplyEffect(B, { kind: "gain-life", amount: 2 });
    expect(game.state.players[B].life).toBe(life + 2);
  });

  it("makes a cost that pays life unpayable", () => {
    const game = makeGame([A, B], ["Toxic Deluge"]);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    const deluge = game.handOf(A).find((id) => game.state.objects[id].cardName === "Toxic Deluge");
    if (deluge === undefined) throw new Error("no Toxic Deluge");
    expect(game.canDispatch({ type: "cast-spell", player: A, card: deluge, xValue: 2 })).toBeNull();
    everybody(game);
    expect(game.canDispatch({ type: "cast-spell", player: A, card: deluge, xValue: 2 })).toMatch(/life/);
    // Paying 0 life is always possible (rule 119.4b).
    expect(game.canDispatch({ type: "cast-spell", player: A, card: deluge, xValue: 0 })).toBeNull();
  });

  it("takes a target whose spell costs life (Terror of the Peaks) off the offered targets", () => {
    const game = makeGame([A, B], ["Lightning Bolt"]);
    game.debugSpawn("Mountain", A, "battlefield");
    const terror = game.debugSpawn("Terror of the Peaks", B, "battlefield");
    const bolt = game.handOf(A).find((id) => game.state.objects[id].cardName === "Lightning Bolt");
    if (bolt === undefined) throw new Error("no Lightning Bolt");
    const offered = (): boolean =>
      game
        .legalActions(A)
        .some(
          (x) =>
            x.kind === "cast-spell" &&
            x.card === bolt &&
            x.targetOptions.some((slot) => slot.some((t) => t.kind === "object" && t.object === terror)),
        );
    expect(offered()).toBe(true);
    everybody(game);
    // Offered and then refused at the cast would be a legal action that throws.
    expect(offered()).toBe(false);
  });
});
