import { defineCard } from "../define.js";

export default defineCard({
  name: "Explosive Vegetation",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    destination: "battlefield",
    enterTapped: true,
    min: 0,
    max: 2,
  },
});
