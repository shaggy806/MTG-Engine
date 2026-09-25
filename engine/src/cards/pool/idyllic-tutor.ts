import { defineCard } from "../define.js";

export default defineCard({
  name: "Idyllic Tutor",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Search your library for an enchantment card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "enchantment" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
