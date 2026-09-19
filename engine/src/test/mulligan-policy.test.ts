/**
 * The bots' opening-hand policy (`bot/mulligan.ts`).
 *
 * These are the shapes the hand-picked constants were chosen against, so a
 * failure here means the numbers moved, not that the test is wrong — decide
 * which of the two you meant before editing either.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import {
  chooseBottomOfHand,
  keptHandSize,
  scoreOpeningHand,
  shouldMulligan,
} from "../bot/mulligan.js";
import { asObjectId } from "../primitives.js";
import type { GameObject } from "../state.js";

const registry = createDefaultRegistry();

/** The policy reads only `id` and `cardName` off a hand card, so a real `Game`
 * would only make it harder to write the hand the test is about. */
const hand = (...names: readonly string[]): readonly GameObject[] =>
  names.map((cardName, i) => ({ id: asObjectId(`h${i}`), cardName }) as GameObject);

const COMMANDER = { openingHandSize: 7, freeFirstMulligan: true } as const;
const LONDON = { openingHandSize: 7, freeFirstMulligan: false } as const;

const keeps = (
  cards: readonly GameObject[],
  taken: number,
  rules: { openingHandSize: number; freeFirstMulligan: boolean },
) => !shouldMulligan(cards, registry, taken, rules);

describe("opening-hand scoring", () => {
  it("ranks a functional hand above a flooded or screwed one", () => {
    const functional = scoreOpeningHand(
      hand("Forest", "Forest", "Mountain", "Llanowar Elves", "Grizzly Bears", "Craw Wurm", "Colossal Dreadmaw"),
      registry,
    );
    const screwed = scoreOpeningHand(
      hand("Forest", "Grizzly Bears", "Craw Wurm", "Colossal Dreadmaw", "Craw Wurm", "Colossal Dreadmaw", "Grizzly Bears"),
      registry,
    );
    const flooded = scoreOpeningHand(
      hand("Forest", "Forest", "Forest", "Mountain", "Mountain", "Forest", "Craw Wurm"),
      registry,
    );
    expect(functional).toBeGreaterThan(screwed);
    expect(functional).toBeGreaterThan(flooded);
  });

  it("counts ramp as both a mana source and an early play", () => {
    const withRamp = hand(
      "Forest", "Forest", "Sol Ring", "Craw Wurm", "Colossal Dreadmaw", "Craw Wurm", "Colossal Dreadmaw",
    );
    // Same shape, with the Sol Ring swapped for a spell of the same cost that
    // makes no mana — the only difference the score should see.
    const withoutRamp = hand(
      "Forest", "Forest", "Lightning Bolt", "Craw Wurm", "Colossal Dreadmaw", "Craw Wurm", "Colossal Dreadmaw",
    );
    expect(scoreOpeningHand(withRamp, registry)).toBeGreaterThan(
      scoreOpeningHand(withoutRamp, registry),
    );
  });

  it("sees a land-fetching sorcery as ramp", () => {
    const fetching = hand("Forest", "Forest", "Forest", "Cultivate", "Craw Wurm", "Craw Wurm", "Craw Wurm");
    const not = hand("Forest", "Forest", "Forest", "Read the Bones", "Craw Wurm", "Craw Wurm", "Craw Wurm");
    expect(scoreOpeningHand(fetching, registry)).toBeGreaterThan(scoreOpeningHand(not, registry));
  });
});

describe("keeping and throwing back", () => {
  const oneLander = hand(
    "Forest", "Craw Wurm", "Colossal Dreadmaw", "Craw Wurm", "Colossal Dreadmaw", "Craw Wurm", "Grizzly Bears",
  );
  const sevenLander = hand("Forest", "Forest", "Forest", "Forest", "Mountain", "Mountain", "Mountain");
  const good = hand(
    "Forest", "Forest", "Forest", "Llanowar Elves", "Grizzly Bears", "Craw Wurm", "Colossal Dreadmaw",
  );

  it("throws back a one-lander and an all-land hand at every size that still matters", () => {
    for (const taken of [0, 1, 2]) {
      expect(keeps(oneLander, taken, COMMANDER)).toBe(false);
      expect(keeps(sevenLander, taken, COMMANDER)).toBe(false);
    }
  });

  it("keeps a functional seven", () => {
    expect(keeps(good, 0, COMMANDER)).toBe(true);
    expect(keeps(good, 0, LONDON)).toBe(true);
  });

  it("lowers the bar as the hand it would keep gets smaller", () => {
    // Two sources and one cheap play: not worth a seven, worth a six.
    const marginal = hand(
      "Forest", "Forest", "Grizzly Bears", "Craw Wurm", "Colossal Dreadmaw", "Craw Wurm", "Colossal Dreadmaw",
    );
    expect(keeps(marginal, 0, LONDON)).toBe(false); // keeping now = 7
    expect(keeps(marginal, 1, LONDON)).toBe(true); // keeping now = 6
  });

  it("takes the free Commander mulligan on a hand it would otherwise keep", () => {
    // Three lands and one thing to do with them: fine, not good.
    const mediocre = hand(
      "Forest", "Forest", "Forest", "Grizzly Bears", "Craw Wurm", "Craw Wurm", "Colossal Dreadmaw",
    );
    // `taken` 0 and 1 both keep seven under the Commander rule, but only the
    // first mulligan is free — so the bar is higher at 0 than at 1, and the
    // same hand is worth throwing back exactly once.
    expect(keeps(mediocre, 0, COMMANDER)).toBe(false);
    expect(keeps(mediocre, 1, COMMANDER)).toBe(true);
    // London, where that first mulligan costs a card, keeps it straight away.
    expect(keeps(mediocre, 0, LONDON)).toBe(true);
  });

  it("keeps a hand of three lands and nothing castable only once it's down to six", () => {
    const clunky = hand(
      "Forest", "Forest", "Forest", "Craw Wurm", "Colossal Dreadmaw", "Craw Wurm", "Colossal Dreadmaw",
    );
    expect(keeps(clunky, 1, COMMANDER)).toBe(false); // keeping now = 7
    expect(keeps(clunky, 2, COMMANDER)).toBe(true); // keeping now = 6
  });

  it("stops mulliganing once it would be down to four cards", () => {
    // Nothing is worse than a hand with no lands at all, and it still keeps.
    const unkeepable = hand(
      "Craw Wurm", "Craw Wurm", "Craw Wurm", "Craw Wurm", "Craw Wurm", "Craw Wurm", "Craw Wurm",
    );
    expect(keptHandSize(4, 7, true)).toBe(4);
    expect(keeps(unkeepable, 4, COMMANDER)).toBe(true);
    expect(keeps(unkeepable, 3, COMMANDER)).toBe(false);
  });
});

describe("bottoming a kept hand", () => {
  const nameOf = (
    cards: readonly GameObject[],
    ids: readonly string[],
  ): readonly string[] =>
    ids.map((id) => cards.find((card) => card.id === id)!.cardName);

  it("bottoms surplus lands before any spell", () => {
    const cards = hand("Forest", "Forest", "Forest", "Forest", "Forest", "Sol Ring", "Craw Wurm");
    const bottom = chooseBottomOfHand(cards, registry, 2);
    expect(nameOf(cards, bottom)).toEqual(["Forest", "Forest"]);
  });

  it("bottoms the most expensive spells when the lands are already scarce", () => {
    const cards = hand(
      "Forest", "Forest", "Grizzly Bears", "Craw Wurm", "Colossal Dreadmaw", "Sol Ring", "Llanowar Elves",
    );
    const bottom = nameOf(cards, chooseBottomOfHand(cards, registry, 2));
    expect(bottom).toContain("Colossal Dreadmaw");
    expect(bottom).toContain("Craw Wurm");
  });

  it("keeps ramp over a same-cost spell", () => {
    const cards = hand("Forest", "Forest", "Craw Wurm", "Arcane Signet", "Night's Whisper");
    const bottom = nameOf(cards, chooseBottomOfHand(cards, registry, 1));
    expect(bottom).not.toContain("Arcane Signet");
  });

  it("returns exactly `count` distinct cards, and nothing for a free mulligan", () => {
    const cards = hand("Forest", "Forest", "Forest", "Craw Wurm", "Craw Wurm", "Sol Ring", "Lightning Bolt");
    expect(chooseBottomOfHand(cards, registry, 0)).toEqual([]);
    const bottom = chooseBottomOfHand(cards, registry, 3);
    expect(bottom).toHaveLength(3);
    expect(new Set(bottom).size).toBe(3);
  });
});
