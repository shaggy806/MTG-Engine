import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "./characteristics.js";
import { createDefaultRegistry } from "./cards.js";
import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import { printedCardName } from "./state.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const reg = createDefaultRegistry();

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const mkGame = (aCards: readonly string[], overrides: Partial<GameConfig> = {}): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, ...overrides.rules },
    ...overrides,
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });

const atMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;

const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

describe("MDFC — Grovewatch Elder // Grovewatch Hollow", () => {
  it("legalActions offers a cast for the front face and a land drop for the back", () => {
    const game = mkGame(["Grovewatch Elder"]);
    game.advanceUntil(atMain);
    for (let i = 0; i < 3; i += 1) {
      game.dispatch({ type: "play-land", player: A, card: inHand(game, "Forest") });
    }
    const card = inHand(game, "Grovewatch Elder");
    const actions = game.legalActions(A).filter((x) => "card" in x && x.card === card);
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "cast-spell", cardName: "Grovewatch Elder", face: 0 }),
        expect.objectContaining({ kind: "play-land", cardName: "Grovewatch Hollow", face: 1 }),
      ]),
    );
  });

  it("casting the front face resolves a 2/3 vigilance creature", () => {
    const game = mkGame(["Grovewatch Elder"]);
    game.advanceUntil(atMain);
    for (let i = 0; i < 3; i += 1) {
      game.dispatch({ type: "play-land", player: A, card: inHand(game, "Forest") });
    }
    const card = inHand(game, "Grovewatch Elder");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], face: 0 });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(printedCardName(game.state.objects[card])).toBe("Grovewatch Elder");
    const c = computeCharacteristics(game.state, reg, card);
    expect([c.power, c.toughness]).toEqual([2, 3]);
    expect(c.keywords.has("vigilance")).toBe(true);
    expect(c.types).toContain("creature");
  });

  it("playing the back face puts an enters-tapped land in play that taps for {G}", () => {
    const game = mkGame(["Grovewatch Elder"]);
    game.advanceUntil(atMain);
    const card = inHand(game, "Grovewatch Elder");
    game.dispatch({ type: "play-land", player: A, card, face: 1 });

    const obj = game.state.objects[card];
    expect(obj.zone).toBe("battlefield");
    expect(obj.face).toBe(1);
    expect(printedCardName(obj)).toBe("Grovewatch Hollow");
    expect(obj.tapped).toBe(true); // enters tapped
    expect(computeCharacteristics(game.state, reg, card).types).toEqual(["land"]);
  });

  it("reverts to the front face when it leaves the battlefield", () => {
    const game = mkGame(["Grovewatch Elder", "Boomerang", "Island", "Island"]);
    game.advanceUntil(atMain);
    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Island") });
    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Island") });
    const card = inHand(game, "Grovewatch Elder");
    game.dispatch({ type: "play-land", player: A, card, face: 1 });
    // Bounce the land back to hand.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Boomerang"),
      targets: [{ kind: "object", object: card }],
    });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[card].zone).toBe("hand");
    expect(game.state.objects[card].face ?? 0).toBe(0); // front face in hand again
    expect(printedCardName(game.state.objects[card])).toBe("Grovewatch Elder");
  });
});
