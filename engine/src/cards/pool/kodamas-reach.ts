import { defineCard } from "../define.js";

/** Cultivate's twin, printed a decade earlier and Arcane instead. */
export default defineCard({
  name: "Kodama's Reach",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Arcane"],
  text: "Search your library for up to two basic land cards, reveal those cards, put one onto the battlefield tapped and the other into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    min: 0,
    max: 2,
    destination: "battlefield",
    enterTapped: true,
    restDestination: "hand",
    reveal: true,
  },
});
