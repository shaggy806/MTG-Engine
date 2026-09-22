/**
 * Eminence (rule 702.106) — an ability that functions while its card is in
 * the **command zone**, not only on the battlefield.
 *
 * Both of the engine's ability scans walk the battlefield, so the feature is
 * a per-ability `fromCommandZone` flag that adds its card to those scans from
 * the command zone too. Per *ability* rather than per card is the whole
 * point: Edgar Markov's first strike, haste and attack trigger do nothing
 * from there, and only the one clause that says so is marked.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[] = []) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Swamp")], commander: "Edgar Markov" },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const vampires = (game: Game): number =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].controller === A &&
      game.characteristics(id).subtypes.includes("Vampire"),
  ).length;
const edgarInCommand = (game: Game): boolean =>
  game.state.zones.shared.command.some(
    (id) => game.state.objects[id].cardName === "Edgar Markov",
  );

describe("Edgar Markov — Eminence", () => {
  it("makes a Vampire while Edgar is still in the command zone", () => {
    const game = mkGame(["Vampire Nighthawk"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    expect(edgarInCommand(game)).toBe(true);
    expect(vampires(game)).toBe(0);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Vampire Nighthawk"),
      targets: [],
    });
    game.advanceUntil(quiet);

    // The Nighthawk plus the token its cast made — from a card that never
    // touched the battlefield.
    expect(vampires(game)).toBe(2);
    expect(edgarInCommand(game)).toBe(true);
  });

  it("doesn't trigger off a non-Vampire spell", () => {
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Grizzly Bears"),
      targets: [],
    });
    game.advanceUntil(quiet);
    expect(vampires(game)).toBe(0);
  });

  it("doesn't trigger off casting Edgar himself — 'another' Vampire spell", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    for (const land of ["Mountain", "Mountain", "Plains", "Plains", "Swamp", "Swamp"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    const edgar = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].cardName === "Edgar Markov",
    );
    expect(edgar).toBeDefined();
    if (edgar === undefined) return;

    game.dispatch({ type: "cast-spell", player: A, card: edgar, targets: [] });
    game.advanceUntil(quiet);

    // Edgar is a Vampire spell, and the card on the stack is itself in the
    // trigger scan, so without `otherOnly` he would make a token off his own
    // cast. Only Edgar should be there.
    expect(vampires(game)).toBe(1);
  });

  it("leaves its other abilities inert in the command zone", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    // A Vampire that can attack, with Edgar still in the command zone. His
    // attack trigger must not fire for someone else's attack, and his own
    // can't fire at all from there.
    const nighthawk = game.debugSpawn("Vampire Nighthawk", A, "battlefield");
    game.state.objects[nighthawk].summoningSick = false;
    expect(edgarInCommand(game)).toBe(true);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: nighthawk, defender: B }],
    });
    game.advanceUntil(quiet);

    // No +1/+1 counter: the attack trigger is `who: "self"` and Edgar isn't
    // on the battlefield to be the attacker.
    expect(game.state.objects[nighthawk].counters["+1/+1"] ?? 0).toBe(0);
  });
});
