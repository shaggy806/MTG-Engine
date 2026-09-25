import { defineCard } from "../define.js";

export default defineCard({
  name: "Shared Roots",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    destination: "battlefield",
    min: 0,
    max: 1,
    enterTapped: true,
  },
});
