import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampiric Tutor",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Search your library for a card, then shuffle and put that card on top. You lose 2 life.",
  effect: {
    kind: "sequence",
    effects: [
      // No filter — "a card", any card, so one must be found while there is
      // one (701.23d). `library-top` puts the find back on top *after* the
      // shuffle the search causes.
      { kind: "search-library", filter: {}, destination: "library-top", min: 1, max: 1 },
      { kind: "lose-life", amount: 2 },
    ],
  },
});
