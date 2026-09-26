import { describe, expect, it } from "vitest";

import { nearestOpponentRule } from "../combat/eligibility.js";
import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * Two commanders whose "as this enters" choice is the card: Talion, the
 * Kindly Lord's number and Pramikon, Sky Rampart's direction. Both are asked
 * before the permanent enters, however it enters (`askEnterChoice`).
 */

const [A, B, C, D] = ["alice", "bob", "carol", "dave"].map(asPlayerId);
const registry = createDefaultRegistry();

function table(players: readonly PlayerId[] = [A, B]): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99 },
    decks: players.map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.turnOrder[s.turn.activePlayerIndex] === A && s.priority.holder === A,
  );
  return game;
}

function spawn(game: Game, name: string, owner: PlayerId, zone: "battlefield" | "hand" = "battlefield"): ObjectId {
  return game.debugSpawn(name, owner, zone, { summoningSick: false });
}

function lands(game: Game, owner: PlayerId, names: readonly string[]): void {
  for (const name of names) spawn(game, name, owner);
}

/** Pass priority around until the stack is empty or a decision is up. */
function settle(game: Game): void {
  for (let i = 0; i < 60; i += 1) {
    if (game.state.awaiting !== null) return;
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) return;
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

/** Cast Talion for alice and name `n` as it enters. */
function talion(game: Game, n: string): ObjectId {
  lands(game, A, ["Island", "Swamp", "Island", "Swamp"]);
  const card = spawn(game, "Talion, the Kindly Lord", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
  settle(game);
  expect(game.state.awaiting).toMatchObject({ kind: "choose-creature-type", player: A });
  game.dispatch({ type: "choose-creature-type", player: A, creatureType: n });
  settle(game);
  expect(game.state.objects[card]).toMatchObject({ zone: "battlefield", chosenOnEnter: n });
  return card;
}

/** Bob casts `name` on his own turn, and it resolves. */
function bobCasts(game: Game, name: string, mana: readonly string[], x?: number): void {
  game.advanceUntil(
    (s) => s.turnOrder[s.turn.activePlayerIndex] === B && s.turn.step === "precombat-main" && s.priority.holder === B,
  );
  lands(game, B, mana);
  const card = spawn(game, name, B, "hand");
  game.dispatch({
    type: "cast-spell",
    player: B,
    card,
    targets: name === "Fireball" || name === "Lightning Bolt" ? [{ kind: "player", player: A }] : [],
    ...(x !== undefined ? { xValue: x } : {}),
  });
  settle(game);
}

describe("Talion, the Kindly Lord", () => {
  it("punishes an opponent's spell whose mana value, power or toughness is the number", () => {
    const game = table();
    talion(game, "1");
    const hand = game.handOf(A).length;
    const life = game.state.players[B].life;

    bobCasts(game, "Grizzly Bears", ["Forest", "Forest"]);
    expect(game.state.players[B].life).toBe(life);

    // Mana value 1.
    bobCasts(game, "Lightning Bolt", ["Mountain"]);
    expect(game.state.players[B].life).toBe(life - 2);
    expect(game.handOf(A).length).toBe(hand + 1);

    // Mana value 0 and 0/2: nothing.
    bobCasts(game, "Ornithopter", []);
    expect(game.state.players[B].life).toBe(life - 2);

    // Mana value 0, but a 1/1.
    bobCasts(game, "Memnite", []);
    expect(game.state.players[B].life).toBe(life - 4);
    expect(game.handOf(A).length).toBe(hand + 2);
  });

  it("matches power or toughness, and a spell's X counts in its mana value", () => {
    const game = table();
    talion(game, "4");
    const hand = game.handOf(A).length;
    const life = game.state.players[B].life;

    // Serra Angel: mana value 5, but 4/4.
    bobCasts(game, "Serra Angel", ["Plains", "Plains", "Plains", "Plains", "Plains"]);
    expect(game.state.players[B].life).toBe(life - 2);
    expect(game.handOf(A).length).toBe(hand + 1);

    // Fireball with X = 3: {X}{R} is mana value 4 on the stack (the ruling).
    const lifeA = game.state.players[A].life;
    bobCasts(game, "Fireball", ["Mountain", "Mountain", "Mountain", "Mountain"], 3);
    expect(game.state.players[A].life).toBe(lifeA - 3);
    expect(game.state.players[B].life).toBe(life - 4);
  });

  it("doesn't see its controller's own spells", () => {
    const game = table();
    talion(game, "2");
    const life = game.state.players[A].life;
    lands(game, A, ["Forest", "Forest"]);
    const bears = spawn(game, "Grizzly Bears", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    settle(game);
    expect(game.state.players[A].life).toBe(life);
  });

  it("with no number chosen, even a spell of mana value 0 misses", () => {
    const game = table();
    // Put straight onto the battlefield, which asks nothing.
    spawn(game, "Talion, the Kindly Lord", A);
    const life = game.state.players[B].life;
    bobCasts(game, "Ornithopter", []);
    expect(game.state.players[B].life).toBe(life);
  });
});

describe("Pramikon, Sky Rampart", () => {
  it("asks for a direction as it enters, and every player attacks that way", () => {
    const game = table([A, B, C, D]);
    lands(game, A, ["Island", "Mountain", "Plains"]);
    const card = spawn(game, "Pramikon, Sky Rampart", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    settle(game);
    expect(game.state.awaiting).toMatchObject({ kind: "choose-creature-type", options: ["left", "right"] });
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "right" });
    settle(game);

    expect(game.state.objects[card]).toMatchObject({ zone: "battlefield", chosenOnEnter: "right" });
    // Right is back in turn order: Alice's is Dave, Bob's is Alice.
    expect(nearestOpponentRule(game.state, registry, A)).toEqual([D]);
    expect(nearestOpponentRule(game.state, registry, B)).toEqual([A]);
  });
});
