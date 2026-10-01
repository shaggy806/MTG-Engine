/**
 * The "reveal land" cycle (Port Town, Game Trail, Foreboding Ruins, Fortified
 * Village): "As this land enters, you may reveal a [type] or [type] card from
 * your hand. If you don't, this land enters tapped."
 *
 * The condition reads the *hand*, which is what distinguishes it from the
 * check-land cycle's `tappedUnless` (a `StaticCondition` over the
 * battlefield). See `tappedUnlessRevealFromHand` in `replacements.ts`.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** A game where A's hand is exactly `hand` and nothing else. */
const gameWithHand = (hand: readonly string[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, openingHandSize: 0 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Grizzly Bears") },
      { player: B, cards: Array<string>(40).fill("Grizzly Bears") },
    ],
  });
  for (const card of hand) game.debugSpawn(card, A, "hand");
  return game;
};

const entersTapped = (game: Game, land: string, player: PlayerId = A): boolean => {
  const id = game.debugSpawn(land, player, "battlefield");
  return game.state.objects[id].tapped;
};

describe("reveal lands", () => {
  it("enters untapped when a matching card is in hand", () => {
    const game = gameWithHand(["Island"]);
    expect(entersTapped(game, "Port Town")).toBe(false);
  });

  it("enters untapped on the second of the two land types", () => {
    const game = gameWithHand(["Plains"]);
    expect(entersTapped(game, "Port Town")).toBe(false);
  });

  it("enters tapped on an empty hand", () => {
    const game = gameWithHand([]);
    expect(entersTapped(game, "Port Town")).toBe(true);
  });

  it("enters tapped when the hand holds only the wrong types", () => {
    const game = gameWithHand(["Mountain", "Forest", "Grizzly Bears"]);
    expect(entersTapped(game, "Port Town")).toBe(true);
  });

  it("reads subtypes, not names — a nonbasic Island counts", () => {
    // Underground River is typed as an Island? No — but Watery Grave is a
    // "Land — Island Swamp", so it satisfies "an Island card".
    const game = gameWithHand(["Watery Grave"]);
    expect(entersTapped(game, "Port Town")).toBe(false);
  });

  it("reads the controller's hand, not an opponent's", () => {
    const game = gameWithHand([]);
    game.debugSpawn("Island", B, "hand");
    expect(entersTapped(game, "Port Town")).toBe(true);
  });

  it("covers the whole cycle", () => {
    for (const [land, matching, wrong] of [
      ["Game Trail", "Mountain", "Island"],
      ["Foreboding Ruins", "Swamp", "Forest"],
      ["Fortified Village", "Forest", "Swamp"],
    ] as const) {
      expect(entersTapped(gameWithHand([matching]), land)).toBe(false);
      expect(entersTapped(gameWithHand([wrong]), land)).toBe(true);
    }
  });
});

describe("reveal lands ask before they enter", () => {
  /** A on their first main phase, holding `hand`, about to play `land`. */
  const playing = (land: string, hand: readonly string[]) => {
    // The hand is dealt once A has priority, so nothing plays from it first.
    const game = gameWithHand([]);
    game.advanceUntil((s: GameState) => s.turn.step === "precombat-main" && s.priority.holder === A && activePlayerOf(s) === A);
    const card = game.debugSpawn(land, A, "hand");
    for (const other of hand) game.debugSpawn(other, A, "hand");
    game.dispatch({ type: "play-land", player: A, card });
    return { game, card };
  };

  it("offers every qualifying card in hand, and nothing else", () => {
    const { game, card } = playing("Port Town", ["Island", "Plains", "Mountain"]);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("reveal-for-untapped");
    if (awaiting?.kind !== "reveal-for-untapped") return;
    expect(awaiting.source).toBe(card);
    expect(awaiting.options.map((id) => game.state.objects[id].cardName).sort()).toEqual([
      "Island",
      "Plains",
    ]);
    // Still in hand: asked before it moves.
    expect(game.state.objects[card].zone).toBe("hand");
    // Which hand cards qualify says what they are: only A sees the options.
    const mine = game.viewFor(A).awaiting;
    const theirs = game.viewFor(B).awaiting;
    expect(mine?.kind === "reveal-for-untapped" && mine.options.length).toBe(2);
    expect(theirs?.kind === "reveal-for-untapped" && theirs.options).toEqual([]);
  });

  it("revealing a card has it enter untapped, and shows everyone the card", () => {
    const { game, card } = playing("Port Town", ["Island"]);
    const island = game.handOf(A).find((id) => game.state.objects[id].cardName === "Island")!;
    const before = game.events.length;
    game.dispatch({ type: "reveal-for-untapped", player: A, reveal: island });
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(game.state.objects[card].tapped).toBe(false);
    expect(game.events.slice(before)).toContainEqual(
      expect.objectContaining({ type: "cards-revealed", player: A, objects: [island], from: "hand" }),
    );
    // Revealed, not moved.
    expect(game.state.objects[island].zone).toBe("hand");
  });

  it("declining has it enter tapped, and reveals nothing", () => {
    const { game, card } = playing("Port Town", ["Island"]);
    const before = game.events.length;
    game.dispatch({ type: "reveal-for-untapped", player: A, reveal: null });
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(game.state.objects[card].tapped).toBe(true);
    expect(game.events.slice(before).some((e) => e.type === "cards-revealed")).toBe(false);
  });

  it("refuses a card it didn't offer", () => {
    const { game } = playing("Port Town", ["Island", "Mountain"]);
    const mountain = game.handOf(A).find((id) => game.state.objects[id].cardName === "Mountain")!;
    expect(() =>
      game.dispatch({ type: "reveal-for-untapped", player: A, reveal: mountain }),
    ).toThrow();
  });

  it("never asks with nothing to reveal, and enters tapped", () => {
    const { game, card } = playing("Port Town", ["Mountain"]);
    expect(game.state.awaiting?.kind).not.toBe("reveal-for-untapped");
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(game.state.objects[card].tapped).toBe(true);
  });
});
