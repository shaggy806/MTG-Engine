/**
 * Lumra, Bellow of the Woods (EDHREC commander rank 321): a "number of lands
 * you control" CDA — `setBasePtFromCount` with a `{ countOf }` filter — that
 * works in every zone (rule 604.3) and counts a token stack as every token in
 * it, plus an ETB that mills four and then returns every land card from your
 * graveyard, the milled ones included.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const LUMRA = "Lumra, Bellow of the Woods";

const registry = createDefaultRegistry();

const mkGame = (aHand: readonly string[] = []): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Island")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });

const mainOf =
  (player: PlayerId) =>
  (s: GameState): boolean =>
    s.turn.step === "precombat-main" && activePlayerOf(s) === player;
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, game.registry, id);
  return [c.power, c.toughness];
};
const lands = (game: Game, player: PlayerId, name: string, n: number): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn(name, player, "battlefield"));

describe("Lumra's CDA — the number of lands you control, in every zone", () => {
  it("counts its owner's lands in hand, library, graveyard and the command zone", () => {
    const game = mkGame();
    game.advanceUntil(mainOf(A));
    lands(game, A, "Forest", 3);
    lands(game, B, "Plains", 5);
    for (const zone of ["hand", "library", "graveyard", "command", "exile"] as const) {
      const lumra = game.debugSpawn(LUMRA, A, zone);
      expect(game.state.objects[lumra].zone).toBe(zone);
      expect(pt(game, lumra)).toEqual([3, 3]);
    }
    // Bob's copy counts Bob's lands, not Alice's.
    expect(pt(game, game.debugSpawn(LUMRA, B, "graveyard"))).toEqual([5, 5]);
  });

  it("re-evaluates on the battlefield as lands come and go, any land type", () => {
    const game = mkGame();
    game.advanceUntil(mainOf(A));
    const forests = lands(game, A, "Forest", 2);
    const lumra = game.debugSpawn(LUMRA, A, "battlefield");
    expect(pt(game, lumra)).toEqual([2, 2]);
    game.debugSpawn("Command Tower", A, "battlefield");
    expect(pt(game, lumra)).toEqual([3, 3]);
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { subtype: "Forest" } });
    game.advanceUntil(settled);
    expect(forests.every((id) => game.state.objects[id].zone === "graveyard")).toBe(true);
    expect(pt(game, lumra)).toEqual([1, 1]);
    // An opponent's land doesn't count.
    lands(game, B, "Plains", 4);
    expect(pt(game, lumra)).toEqual([1, 1]);
  });

  it("counts a token stack of lands as every token in it", () => {
    const game = mkGame();
    game.advanceUntil(mainOf(A));
    const lumra = game.debugSpawn(LUMRA, A, "battlefield");
    const [stack] = lands(game, A, "Forest", 1);
    game.state.objects[stack].isToken = true;
    game.state.objects[stack].stackCount = 12;
    expect(pt(game, lumra)).toEqual([12, 12]);
  });
});

describe("Lumra's ETB — mill four, then return every land card", () => {
  it("returns the lands it milled and the ones already there, tapped", () => {
    const game = mkGame([LUMRA]);
    game.advanceUntil(mainOf(A));
    lands(game, A, "Forest", 6);
    const oldPlains = game.debugSpawn("Plains", A, "graveyard");
    const theirs = game.debugSpawn("Mountain", B, "graveyard");
    // Top four, top first (debugSpawn puts a library card on top).
    const bolt = game.debugSpawn("Lightning Bolt", A, "library");
    const swamp = game.debugSpawn("Swamp", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const forest = game.debugSpawn("Forest", A, "library");
    const fifth = game.state.zones.perPlayer[A].library[4];

    const lumra = game.handOf(A).find((id) => game.state.objects[id].cardName === LUMRA);
    if (lumra === undefined) throw new Error("no Lumra in hand");
    game.dispatch({ type: "cast-spell", player: A, card: lumra, targets: [] });
    game.advanceUntil(settled);

    expect(game.state.objects[lumra].zone).toBe("battlefield");
    for (const id of [forest, swamp, oldPlains]) {
      expect(game.state.objects[id].zone).toBe("battlefield");
      expect(game.state.objects[id].controller).toBe(A);
      expect(game.state.objects[id].tapped).toBe(true);
    }
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[bolt].zone).toBe("graveyard");
    // Exactly four milled: the fifth card is still on top.
    expect(game.state.zones.perPlayer[A].library[0]).toBe(fifth);
    // Only *your* graveyard.
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    // Six Forests + Forest + Swamp + Plains.
    expect(pt(game, lumra)).toEqual([9, 9]);
  });
});
