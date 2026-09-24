/**
 * `setBasePtFromCount` reading any `CardFilter` (rule 604.3): `{ countOf }`
 * over the battlefield and `{ countInGraveyard }` over every graveyard, and
 * the re-entrancy guard for a count whose filter asks about the CDA's own
 * object. Lumra, Bellow of the Woods has its own file.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { computeCharacteristics, withComputedCache } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** A CDA whose count reads a *computed* characteristic (a keyword), so it asks
 * about its own object — the case the re-entrancy guard exists for. */
const SKY_COUNTER = defineCard({
  name: "Sky Counter Test Creature",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 0,
  toughness: 0,
  keywords: ["flying"],
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "creature", keyword: "flying", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
    },
  ],
});
const registry = createDefaultRegistry().register(SKY_COUNTER);

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

const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, game.registry, id);
  return [c.power, c.toughness];
};
const lands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};

describe("a CDA whose count reads a computed characteristic", () => {
  it("counts itself without recursing, and caches the true value", () => {
    const game = mkGame();
    game.advanceUntil(mainOf(A));
    const counter = game.debugSpawn(SKY_COUNTER.name, A, "battlefield");
    game.debugSpawn("Serra Angel", A, "battlefield");
    game.debugSpawn("Serra Angel", A, "battlefield");
    game.debugSpawn("Serra Angel", B, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(pt(game, counter)).toEqual([3, 3]);
    // Two of them, each counting the other: every read inside one cache
    // region — including the one nested in the other's count — is true.
    const second = game.debugSpawn(SKY_COUNTER.name, A, "battlefield");
    withComputedCache(() => {
      expect(pt(game, counter)).toEqual([4, 4]);
      expect(pt(game, second)).toEqual([4, 4]);
      expect(pt(game, counter)).toEqual([4, 4]);
    });
  });
});

describe("pool CDAs moved onto filters", () => {
  it("Beanstalk Giant counts lands you control; Mortivore creature cards in all graveyards", () => {
    const game = mkGame();
    game.advanceUntil(mainOf(A));
    lands(game, A, "Forest", 4);
    const giant = game.debugSpawn("Beanstalk Giant", A, "hand");
    expect(pt(game, giant)).toEqual([4, 4]);
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Serra Angel", B, "graveyard");
    game.debugSpawn("Lightning Bolt", B, "graveyard");
    const mortivore = game.debugSpawn("Mortivore", A, "battlefield");
    expect(pt(game, mortivore)).toEqual([2, 2]);
  });
});
