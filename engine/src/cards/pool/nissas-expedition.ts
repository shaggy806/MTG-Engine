import { defineCard } from "../define.js";

export default defineCard({
  name: "Nissa's Expedition",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["sorcery"],
  convoke: true,
  text: "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\nSearch your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    min: 0,
    max: 2,
    destination: "battlefield",
    enterTapped: true,
  },
});
