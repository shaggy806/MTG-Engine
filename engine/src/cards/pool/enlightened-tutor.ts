import { defineCard } from "../define.js";

export default defineCard({
  name: "Enlightened Tutor",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Search your library for an artifact or enchantment card, reveal it, then shuffle and put that card on top.",
  effect: {
    kind: "search-library",
    filter: { typesAnyOf: ["artifact", "enchantment"] },
    destination: "library-top",
    min: 0,
    max: 1,
    // "… reveal it …" — Vampiric Tutor pointedly does not.
    reveal: true,
  },
});
