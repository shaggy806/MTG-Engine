import { defineCard } from "../define.js";

export default defineCard({
  name: "Open the Armory",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Search your library for an Aura or Equipment card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { subtypes: ["Aura", "Equipment"] },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
