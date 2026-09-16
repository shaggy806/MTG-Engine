import { defineCard } from "../define.js";

export default defineCard({
  name: "Harvest Season",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for up to X basic land cards, where X is the number of tapped creatures you control, put those cards onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    min: 0,
    max: { countOf: { type: "creature", controlledBy: "you", tapped: true } },
    destination: "battlefield",
    enterTapped: true,
  },
});
