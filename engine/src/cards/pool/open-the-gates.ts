import { defineCard } from "../define.js";

// EDHREC rank 4852.

export default defineCard({
  name: "Open the Gates",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a basic land card or Gate card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { anyOf: [{ type: "land", supertype: "basic" }, { subtype: "Gate" }] },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
