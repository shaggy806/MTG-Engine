import { defineCard } from "../define.js";

export default defineCard({
  name: "Farseek",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a Plains, Island, Swamp, or Mountain card, put it onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "land", subtypes: ["Plains", "Island", "Swamp", "Mountain"] },
    destination: "battlefield",
    min: 0,
    max: 1,
    enterTapped: true,
  },
});
