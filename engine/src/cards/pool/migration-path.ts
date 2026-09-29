import { defineCard } from "../define.js";

export default defineCard({
  name: "Migration Path",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.\n" +
    "Cycling {2} ({2}, Discard this card: Draw a card.)",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    destination: "battlefield",
    enterTapped: true,
    min: 0,
    max: 2,
  },
  cycling: { cost: "{2}" },
});
