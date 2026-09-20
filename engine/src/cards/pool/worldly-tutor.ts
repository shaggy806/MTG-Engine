import { defineCard } from "../define.js";

export default defineCard({
  name: "Worldly Tutor",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Search your library for a creature card, reveal it, then shuffle and put the card on top.",
  effect: {
    kind: "search-library",
    filter: { type: "creature" },
    // The find never leaves the library: `library-top` places it *after* the
    // search's own shuffle (rule 701.19j), which is what keeps it on top.
    destination: "library-top",
    min: 0,
    max: 1,
    reveal: true,
  },
});
