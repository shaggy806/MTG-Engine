import { defineCard } from "../define.js";

export default defineCard({
  name: "Personal Tutor",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Search your library for a sorcery card, reveal it, then shuffle and put that card on top.",
  effect: {
    kind: "search-library",
    filter: { type: "sorcery" },
    destination: "library-top",
    reveal: true,
    min: 0,
    max: 1,
  },
});
