import { defineCard } from "../define.js";

/** Vampiric Tutor at sorcery speed — the Portal Three Kingdoms printing. */
export default defineCard({
  name: "Imperial Seal",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Search your library for a card, then shuffle and put that card on top. You lose 2 life.",
  effect: {
    kind: "sequence",
    effects: [
      // "A card", no quality: one must be found while there is one (701.23d).
      { kind: "search-library", filter: {}, destination: "library-top", min: 1, max: 1 },
      { kind: "lose-life", amount: 2 },
    ],
  },
});
