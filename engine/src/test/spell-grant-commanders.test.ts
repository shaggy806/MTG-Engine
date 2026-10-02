/**
 * Commanders that grant their controller's spells a keyword: Prismari, the
 * Inspiration (instants and sorceries have storm), Storm, Force of Nature
 * (the next instant or sorcery this turn has storm) and Teval, Arbiter of
 * Virtue (spells have delve — X included — and cost life equal to their
 * mana value).
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const bob: TargetRef = { kind: "player", player: B };

const setUp = (lands: readonly [string, number][]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: [
      { player: A, cards: Array<string>(60).fill("Wastes") },
      { player: B, cards: Array<string>(60).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const [land, n] of lands) {
    for (let i = 0; i < n; i += 1) game.debugSpawn(land, A, "battlefield", { summoningSick: false });
  }
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Resolves the stack, answering a copy's new targets (rule 707.10c) by
 * keeping them on Bob. */
const resolveAll = (game: Game): void => {
  for (let i = 0; i < 50; i += 1) {
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind !== "choose-targets") throw new Error(`unexpected ${awaiting.kind}`);
    game.dispatch({ type: "choose-targets", player: awaiting.player, targets: awaiting.specs.map(() => bob) });
  }
};

const castShock = (game: Game): void => {
  const shock = game.debugSpawn("Shock", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card: shock, targets: [bob] });
  resolveAll(game);
};

describe("Prismari, the Inspiration", () => {
  it("gives an instant storm: the second Shock this turn is copied once", () => {
    const game = setUp([["Mountain", 4]]);
    game.debugSpawn("Prismari, the Inspiration", A, "battlefield");
    castShock(game);
    expect(game.state.players[B].life).toBe(18);
    castShock(game);
    expect(game.state.players[B].life).toBe(14);
  });
});

describe("Storm, Force of Nature", () => {
  it("gives storm to the next instant only, after it deals combat damage", () => {
    const game = setUp([["Mountain", 6]]);
    const storm = game.debugSpawn("Storm, Force of Nature", A, "battlefield", { summoningSick: false });
    castShock(game); // one spell before: 20 → 18
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: storm, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && s.priority.holder === A);
    resolveAll(game);
    expect(game.state.players[B].life).toBe(15); // 3 combat damage
    castShock(game); // storm: copied once for the Shock before it
    expect(game.state.players[B].life).toBe(11);
    castShock(game); // the next one has no storm
    expect(game.state.players[B].life).toBe(9);
  });
});

describe("Teval, Arbiter of Virtue", () => {
  type Cast = Extract<LegalAction, { kind: "cast-spell" }>;
  const offer = (game: Game, card: ObjectId): Cast | undefined =>
    game.legalActions(A).find((a): a is Cast => a.kind === "cast-spell" && a.card === card);
  const fillYard = (game: Game, n: number): ObjectId[] =>
    Array.from({ length: n }, () => game.debugSpawn("Grizzly Bears", A, "graveyard"));

  it("gives a spell without it delve", () => {
    const game = setUp([["Island", 2]]);
    const concentrate = game.debugSpawn("Concentrate", A, "hand");
    const yard = fillYard(game, 2);
    expect(offer(game, concentrate)).toBeUndefined();
    game.debugSpawn("Teval, Arbiter of Virtue", A, "battlefield");
    expect(offer(game, concentrate)?.delve).toMatchObject({ minCards: 2, maxCards: 2 });
    const life = game.state.players[A].life;
    game.dispatch({ type: "cast-spell", player: A, card: concentrate, targets: [], delve: yard });
    resolveAll(game);
    // Its mana value is 4, delved or not.
    expect(game.state.players[A].life).toBe(life - 4);
    for (const id of yard) expect(game.state.objects[id].zone).toBe("exile");
  });

  it("lets delve pay for X, as far as the graveyard reaches", () => {
    const game = setUp([["Island", 3]]);
    game.debugSpawn("Teval, Arbiter of Virtue", A, "battlefield");
    const spring = game.debugSpawn("Mind Spring", A, "hand");
    const yard = fillYard(game, 5);
    const cast = offer(game, spring);
    // {X}{U}{U}: one Island spare, five cards — X up to 6.
    expect(cast?.xCost?.maxX).toBe(6);
    expect(cast?.delve?.byX?.[0]).toEqual({ minCards: 0, maxCards: 0 });
    expect(cast?.delve?.byX?.[4]).toEqual({ minCards: 3, maxCards: 4 });
    expect(cast?.delve?.byX?.[6]).toEqual({ minCards: 5, maxCards: 5 });
    const hand = game.handOf(A).length;
    const life = game.state.players[A].life;
    game.dispatch({ type: "cast-spell", player: A, card: spring, targets: [], xValue: 6, delve: yard });
    resolveAll(game);
    expect(game.handOf(A).length).toBe(hand - 1 + 6);
    // Mana value with X as cast: 6 + 2.
    expect(game.state.players[A].life).toBe(life - 8);
  });
});
