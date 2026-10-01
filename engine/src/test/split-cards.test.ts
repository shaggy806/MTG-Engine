/**
 * Split cards (rule 709) — Expansion // Explosion. Casting picks a half
 * (709.3) and only that half exists on the stack (709.3b); in every other
 * zone the card is both halves combined (709.4): both names, the combined
 * mana cost and mana value, both colours.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { manaValue, parseManaCost } from "../mana.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { printedCardName } from "../state.js";
import type { TargetRef } from "../target.js";

const registry = createDefaultRegistry();
const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(60).fill("Island") },
      { player: B, cards: Array<string>(60).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const [land, n] of [["Mountain", 6], ["Island", 6]] as const) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(land, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
  const card = game.debugSpawn("Expansion // Explosion", A, "hand");
  return { game, card };
};
const castOffers = (game: Game, card: ObjectId) =>
  game.legalActions(A).filter((a) => a.kind === "cast-spell" && a.card === card);

describe("a split card", () => {
  it("is both halves combined in the hand", () => {
    const { game, card } = setUp();
    const object = game.state.objects[card];
    expect(printedCardName(object)).toBe("Expansion // Explosion");
    expect(manaValue(parseManaCost(registry.get(printedCardName(object)).manaCost))).toBe(6);
    expect([...game.characteristics(card).colors].sort()).toEqual(["R", "U"]);
  });

  it("is cast as one half or the other, never the whole", () => {
    const { game, card } = setUp();
    // Something for Expansion to copy.
    const shock = game.debugSpawn("Shock", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: shock, targets: [player(B)] });
    const faces = castOffers(game, card).map((a) => (a.kind === "cast-spell" ? a.face : undefined));
    expect([...new Set(faces)].sort()).toEqual([1, 2]);
  });

  it("is only the half cast on the stack, and the whole card again in the graveyard", () => {
    const { game, card } = setUp();
    const before = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      face: 2,
      xValue: 3,
      targets: [player(B), player(A)],
    });
    expect(printedCardName(game.state.objects[card])).toBe("Explosion");
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(17);
    // Three drawn, the split card gone from hand.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(before - 1 + 3);
    expect(game.state.objects[card].zone).toBe("graveyard");
    expect(printedCardName(game.state.objects[card])).toBe("Expansion // Explosion");
  });

  it("copies a spell of mana value 4 or less with Expansion, not a bigger one", () => {
    const { game, card } = setUp();
    const [first, second] = [0, 1].map(() => game.debugSpawn("Grizzly Bears", B, "battlefield"));
    const shock = game.debugSpawn("Shock", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: shock, targets: [obj(first)] });
    game.dispatch({ type: "cast-spell", player: A, card, face: 1, targets: [obj(shock)] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(second)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[first].zone).toBe("graveyard");
    expect(game.state.objects[second].zone).toBe("graveyard");

    // Explosion with X=1 is mana value 5 on the stack ({X} counts, rule
    // 202.3e): out of Expansion's reach.
    const explosion = game.debugSpawn("Expansion // Explosion", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: explosion, face: 2, xValue: 1, targets: [player(B), player(A)] });
    const third = game.debugSpawn("Expansion // Explosion", A, "hand");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: third, face: 1, targets: [obj(explosion)] }),
    ).toThrow();
  });
});
