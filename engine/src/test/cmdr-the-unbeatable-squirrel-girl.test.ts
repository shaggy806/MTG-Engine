/**
 * The Unbeatable Squirrel Girl — {1}{G}{G}{G} legendary 4/4 Squirrel Human Hero.
 *
 *   Do You Like Squirrels? — Whenever The Unbeatable Squirrel Girl enters or
 *   attacks, create a 1/1 green Squirrel creature token.
 *   I LOVE Squirrels! — {1}{G}{G}{G}: Create X 1/1 green Squirrel creature
 *   tokens, where X is the number of Squirrels you control.
 *
 * Driven through the real `Game`. What each test pins down:
 *
 * - the printed stat block and colour identity;
 * - "enters **or** attacks" — one token on entering, one more on attacking,
 *   one at a time, never X;
 * - the negatives on both halves of that trigger: another permanent entering
 *   makes nothing, and another creature attacking *without* her makes nothing;
 * - X is the number of **Squirrels you control**, read as the ability
 *   resolves: she counts herself, her own tokens count, and an opponent's
 *   Squirrels and your non-Squirrel creatures don't;
 * - the ability costs mana and **no {T}**, so it works while she's summoning
 *   sick and can be activated more than once in a turn — and isn't offered at
 *   all when the mana isn't there.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const [A, B] = ["alice", "bob"].map(asPlayerId);
const GIRL = "The Unbeatable Squirrel Girl";
const registry = createDefaultRegistry();

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(60).fill("Forest") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function spawn(game: Game, name: string, player: PlayerId = A): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: false });
}

/** Untapped Forests, so the engine's auto-payer can fund {1}{G}{G}{G}. */
function forests(game: Game, count: number, player: PlayerId = A): void {
  for (let i = 0; i < count; i++) spawn(game, "Forest", player);
}

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Squirrel *permanents* `player` controls, a compacted token stack counting
 * as every token in it — the same thing `{ countOf }` counts. */
function squirrels(game: Game, player: PlayerId = A): number {
  return game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter(
      (o) => o.controller === player && game.characteristics(o.id).subtypes.includes("Squirrel"),
    )
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
}

/** Just the tokens, so a test can say how many were *made*. */
function tokens(game: Game, player: PlayerId = A): number {
  return game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === "Squirrel Token" && o.controller === player)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
}

function girlOffer(game: Game, girl: ObjectId) {
  return game.legalActions(A).find((a) => a.kind === "activate-ability" && a.source === girl);
}

function activate(game: Game, girl: ObjectId): void {
  game.dispatch({ type: "activate-ability", player: A, source: girl, abilityIndex: 0, targets: [] });
  game.advanceUntil(quiet);
}

/** Declare `attackers` against Bob and settle whatever that fires. */
function attackWith(game: Game, attackers: readonly ObjectId[]): void {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
  game.dispatch({
    type: "declare-attackers",
    player: A,
    attackers: attackers.map((attacker) => ({ attacker, defender: B })),
  });
}

describe("The Unbeatable Squirrel Girl — the printed card", () => {
  it("is a {1}{G}{G}{G} legendary 4/4 Squirrel Human Hero in green identity", () => {
    const def = registry.get(GIRL);
    expect(def.manaCost).toBe("{1}{G}{G}{G}");
    expect(def.colors).toEqual(["G"]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Squirrel", "Human", "Hero"]);
    expect([def.power, def.toughness]).toEqual([4, 4]);
    expect(identityString(colorIdentityOf(def))).toBe("G");
  });

  it("carries 'enters or attacks' as two triggers and one mana-cost ability", () => {
    const def = registry.get(GIRL);
    expect(def.triggered.map((t) => t.trigger)).toEqual([
      { on: "enters-battlefield", who: "self" },
      { on: "attacks", who: "self" },
    ]);
    expect(def.activated).toHaveLength(1);
    expect(def.activated[0].cost.mana).toBe("{1}{G}{G}{G}");
    // No {T} — that's what makes the ability repeatable and sickness-proof.
    expect(def.activated[0].cost.tap).toBe(false);
  });
});

describe("The Unbeatable Squirrel Girl — Do You Like Squirrels?", () => {
  it("makes exactly one 1/1 green Squirrel when she enters", () => {
    const game = table();
    game.debugSpawn(GIRL, A, "battlefield", { summoningSick: false, announceEntry: true });
    game.advanceUntil(quiet);

    expect(tokens(game)).toBe(1);
    const token = game.state.zones.shared.battlefield
      .map((id) => game.state.objects[id])
      .find((o) => o.cardName === "Squirrel Token");
    if (token === undefined) throw new Error("no Squirrel token");
    const chars = game.characteristics(token.id);
    expect(token.isToken).toBe(true);
    expect([chars.power, chars.toughness]).toEqual([1, 1]);
    expect([...chars.colors]).toEqual(["G"]);
    expect(chars.types).toEqual(["creature"]);
    expect(chars.subtypes).toContain("Squirrel");
  });

  it("makes one more when she attacks — one, not X", () => {
    const game = table();
    const girl = spawn(game, GIRL);
    // Three Squirrels already out: if the attack trigger read X it would make
    // four. It doesn't; the trigger is flat 1.
    game.debugApplyEffect(A, { kind: "create-token", token: "Squirrel Token", count: 3 });
    game.advanceUntil(quiet);
    expect(tokens(game)).toBe(3);

    attackWith(game, [girl]);
    expect(game.state.zones.shared.stack).toHaveLength(1);
    game.advanceUntil(quiet);

    expect(tokens(game)).toBe(4);
  });

  it("does not fire when some other permanent enters", () => {
    const game = table();
    spawn(game, GIRL);
    game.advanceUntil(quiet);
    expect(tokens(game)).toBe(0);

    game.debugSpawn("Grizzly Bears", A, "battlefield", {
      summoningSick: false,
      announceEntry: true,
    });
    game.advanceUntil(quiet);

    expect(tokens(game)).toBe(0);
  });

  it("does not fire when another creature attacks without her", () => {
    const game = table();
    spawn(game, GIRL);
    const bears = spawn(game, "Grizzly Bears");
    game.advanceUntil(quiet);

    attackWith(game, [bears]);
    game.advanceUntil(quiet);

    expect(tokens(game)).toBe(0);
  });
});

describe("The Unbeatable Squirrel Girl — I LOVE Squirrels!", () => {
  it("creates X tokens, counting herself", () => {
    const game = table();
    const girl = spawn(game, GIRL);
    forests(game, 4);
    game.advanceUntil(quiet);

    activate(game, girl);

    // She is the only Squirrel when it resolves: X = 1.
    expect(tokens(game)).toBe(1);
    expect(squirrels(game)).toBe(2);
  });

  it("counts only Squirrels you control — not an opponent's, not your other creatures", () => {
    const game = table();
    const girl = spawn(game, GIRL);
    forests(game, 4);
    game.debugApplyEffect(A, { kind: "create-token", token: "Squirrel Token", count: 2 });
    game.debugApplyEffect(B, { kind: "create-token", token: "Squirrel Token", count: 5 });
    spawn(game, "Grizzly Bears", A);
    spawn(game, "Llanowar Elves", A);
    game.advanceUntil(quiet);
    expect(squirrels(game, A)).toBe(3);
    expect(squirrels(game, B)).toBe(5);

    activate(game, girl);

    // X = 3 (Squirrel Girl + her two tokens), so three more — Bob's five and
    // Alice's two non-Squirrels are no part of it.
    expect(tokens(game, A)).toBe(2 + 3);
    expect(squirrels(game, A)).toBe(6);
    expect(tokens(game, B)).toBe(5);
  });

  it("needs no {T}: activatable while summoning sick, and twice in one turn", () => {
    const game = table();
    const girl = game.debugSpawn(GIRL, A, "battlefield", { summoningSick: true });
    forests(game, 8);
    game.advanceUntil(quiet);
    expect(game.state.objects[girl].summoningSick).toBe(true);

    activate(game, girl);
    expect(squirrels(game)).toBe(2); // X was 1
    expect(game.state.objects[girl].tapped).toBe(false);

    activate(game, girl);
    expect(squirrels(game)).toBe(4); // X was 2
    expect(game.state.objects[girl].tapped).toBe(false);
  });

  it("is not offered when the mana isn't there", () => {
    const game = table();
    const girl = spawn(game, GIRL);
    forests(game, 3);
    game.advanceUntil(quiet);
    expect(girlOffer(game, girl)).toBeUndefined();

    forests(game, 1);
    expect(girlOffer(game, girl)).toBeDefined();
  });
});
