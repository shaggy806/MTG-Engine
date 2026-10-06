import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

// "You may sacrifice two …" (an `each-player-may` / `unless` sacrifice option
// with a `count`): offered only to a player with that many to sacrifice (rule
// 118.3). Strefan, Maurer Progenitor (top-500 commander) and Rakdos, Patron
// of Chaos (top-5000 card).

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (players: readonly PlayerId[] = [A, B]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array(40).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const afterAttackTriggers = (s: GameState): boolean =>
  s.turn.step === "declare-attackers" && s.zones.shared.stack.length === 0 && s.awaiting === null;
const turnTwo = (s: GameState): boolean => s.turn.number === 2;

describe("Strefan, Maurer Progenitor", () => {
  it("makes a Blood token at your end step for each player who lost life this turn", () => {
    const { game } = mkGame();
    game.debugSpawn("Strefan, Maurer Progenitor", A, "battlefield");
    // Both players lose life; a later gain doesn't undo it (2021-11-19 ruling).
    game.debugApplyEffect(A, { kind: "lose-life", amount: 1, who: "each-player" });
    game.debugApplyEffect(A, { kind: "gain-life", amount: 5 });
    game.advanceUntil(turnTwo);
    expect(named(game, "Blood Token").length).toBe(2);
  });

  it("sacrifices two Blood tokens to put a Vampire onto the battlefield attacking, indestructible this turn", () => {
    const { game, c } = mkGame();
    const strefan = game.debugSpawn("Strefan, Maurer Progenitor", A, "battlefield", { summoningSick: false });
    game.debugApplyEffect(A, { kind: "create-token", token: "Blood Token", count: 2 });
    const nighthawk = game.debugSpawn("Vampire Nighthawk", A, "hand");
    c[A].declareAttackersFn = () => [{ attacker: strefan, defender: B }];
    c[A].chooseModesFn = () => [0];
    c[A].chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    game.advanceUntil(afterAttackTriggers);
    expect(named(game, "Blood Token").length).toBe(0);
    const obj = game.state.objects[nighthawk];
    expect(obj.zone).toBe("battlefield");
    expect(obj.tapped).toBe(true);
    expect(obj.attacking).toBe(B);
    expect(game.characteristics(nighthawk).keywords.has("indestructible")).toBe(true);
    // Strefan himself isn't what was put onto the battlefield this way.
    expect(game.characteristics(strefan).keywords.has("indestructible")).toBe(false);
  });

  it("isn't offered the sacrifice with only one Blood token", () => {
    const { game, c } = mkGame();
    const strefan = game.debugSpawn("Strefan, Maurer Progenitor", A, "battlefield", { summoningSick: false });
    game.debugApplyEffect(A, { kind: "create-token", token: "Blood Token", count: 1 });
    const [blood] = named(game, "Blood Token");
    const nighthawk = game.debugSpawn("Vampire Nighthawk", A, "hand");
    c[A].declareAttackersFn = () => [{ attacker: strefan, defender: B }];
    c[A].chooseModesFn = () => [0];
    c[A].chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    game.advanceUntil(afterAttackTriggers);
    expect(game.state.objects[blood].zone).toBe("battlefield");
    expect(game.state.objects[nighthawk].zone).toBe("hand");
  });
});

describe("Rakdos, Patron of Chaos", () => {
  it("the target opponent sacrifices two nonland, nontoken permanents, and you draw nothing", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Rakdos, Patron of Chaos", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const elves = game.debugSpawn("Llanowar Elves", B, "battlefield");
    c[B].chooseModesFn = () => [0];
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.advanceUntil(turnTwo);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[elves].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand);
  });

  it("with only one nonland, nontoken permanent the opponent can't, so you draw two", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Rakdos, Patron of Chaos", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugSpawn("Mountain", B, "battlefield");
    c[B].chooseModesFn = () => [0];
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 2);
  });
});
