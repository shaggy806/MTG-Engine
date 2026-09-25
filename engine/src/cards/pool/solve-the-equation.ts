import { defineCard } from "../define.js";

export default defineCard({
  name: "Solve the Equation",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Search your library for an instant or sorcery card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { typesAnyOf: ["instant", "sorcery"] },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
