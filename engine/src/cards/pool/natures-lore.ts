import { defineCard } from "../define.js";

export default defineCard({
  name: "Nature's Lore",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a Forest card, put it onto the battlefield, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { subtype: "Forest", type: "land" },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
});
