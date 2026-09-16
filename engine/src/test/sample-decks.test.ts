import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { validateCommanderDeck } from "../deck-validation.js";
import { SAMPLE_DECKS } from "../sample-decks.js";

const reg = createDefaultRegistry();

describe("SAMPLE_DECKS", () => {
  for (const deck of SAMPLE_DECKS) {
    describe(deck.name, () => {
      it("is a legal 100-card Commander deck of implemented cards", () => {
        expect(deck.commander).toBeDefined();
        // validateCommanderDeck only checks cards it knows, so an
        // unimplemented name has to be caught here.
        const unimplemented = [deck.commander!, ...deck.cards].filter((n) => !reg.has(n));
        expect(unimplemented).toEqual([]);

        const result = validateCommanderDeck(
          { commanders: [deck.commander!], cards: deck.cards, size: 100 },
          reg,
        );
        expect(result.violations).toEqual([]);
        expect(result.legal).toBe(true);
      });

      it("substitutes only cards the engine still doesn't implement", () => {
        // A substitution is a stand-in until its original is authored. Once
        // it is, delete the entry so the deck plays the printed card.
        const nowImplemented = (deck.substitutions ?? [])
          .map((s) => s.original)
          .filter((name) => reg.has(name));
        expect(
          nowImplemented,
          "implemented now — delete these entries from its substitutions table",
        ).toEqual([]);
      });

      it("plays the printed list with exactly its substitutions swapped in", () => {
        const printed = deck.printed ?? [];
        expect(printed).toHaveLength(99);
        const swap = new Map((deck.substitutions ?? []).map((s) => [s.original, s.substitute]));
        expect(deck.cards).toEqual(printed.map((n) => swap.get(n) ?? n));
        // Two entries for the same original, or a substitute that's also a
        // printed card, would break singleton in a way the table hides.
        expect(swap.size).toBe((deck.substitutions ?? []).length);
        for (const s of deck.substitutions ?? []) {
          expect(printed, `${s.substitute} is already in the printed list`).not.toContain(s.substitute);
        }
      });
    });
  }
});
