/**
 * A characteristic-defining ability from the greatest mana value among
 * permanents (`CountSpec`'s `greatestManaValueOf` — Karn, Legacy Reforged's
 * "power and toughness are each equal to the greatest mana value among
 * artifacts you control"), on a stand-in card: Karn itself still needs its
 * restricted upkeep mana. Mana value isn't folded by the layers, so reading
 * it inside the fold depends on nothing the fold computes.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry, defineCard } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const GOLEM = defineCard({
  name: "Test Reforged Golem",
  manaCost: "{5}",
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 0,
  toughness: 0,
  text: "Its power and toughness are each equal to the greatest mana value among artifacts you control.",
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { greatestManaValueOf: { type: "artifact", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: "Its power and toughness are each equal to the greatest mana value among artifacts you control.",
    },
  ],
});
const registry = createDefaultRegistry().register(GOLEM);

const mkGame = (): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    registry,
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });

describe("greatestManaValueOf — a CDA from the greatest mana value", () => {
  it("counts itself, the greatest of your artifacts, and none of an opponent's", () => {
    const game = mkGame();
    const golem = game.debugSpawn("Test Reforged Golem", A);
    const pt = () => {
      const c = computeCharacteristics(game.state, registry, golem);
      return [c.power, c.toughness];
    };
    // Its own mana value 5.
    expect(pt()).toEqual([5, 5]);
    game.debugSpawn("Sol Ring", A);
    expect(pt()).toEqual([5, 5]);
    // An opponent's bigger artifact doesn't count.
    game.debugSpawn("Phyrexian Metamorph", B);
    game.debugSpawn("Auton Soldier", B);
    expect(pt()).toEqual([5, 5]);
    // Yours does.
    game.debugSpawn("Auton Soldier", A);
    expect(pt()).toEqual([6, 6]);
  });
});
