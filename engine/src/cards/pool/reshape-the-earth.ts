import { defineCard } from "../define.js";

// EDHREC rank 3368.

export default defineCard({
  name: "Reshape the Earth",
  manaCost: "{6}{G}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for up to ten land cards, put them onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "land" },
    destination: "battlefield",
    enterTapped: true,
    min: 0,
    max: 10,
  },
});
