import { defineCard } from "../define.js";

export default defineCard({
  name: "Beneath the Sands",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  cycling: { cost: "{2}" },
  text: "Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    destination: "battlefield",
    min: 0,
    max: 1,
    enterTapped: true,
  },
});
