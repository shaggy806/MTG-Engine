import { defineCard } from "../define.js";

export default defineCard({
  name: "Mystical Tutor",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Search your library for an instant or sorcery card, reveal it, then shuffle and put that card on top.",
  effect: {
    kind: "search-library",
    filter: { typesAnyOf: ["instant", "sorcery"] },
    destination: "library-top",
    min: 0,
    max: 1,
    // "… reveal it …" — Vampiric Tutor pointedly does not.
    reveal: true,
  },
});
