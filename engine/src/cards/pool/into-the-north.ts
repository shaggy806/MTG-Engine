import { defineCard } from "../define.js";

// EDHREC rank 4798.

export default defineCard({
  name: "Into the North",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a snow land card, put it onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "land", supertype: "snow" },
    destination: "battlefield",
    enterTapped: true,
    min: 0,
    max: 1,
  },
});
