import { defineCard } from "../define.js";

export default defineCard({
  name: "Circuitous Route",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Search your library for up to two basic land cards and/or Gate cards, put them onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { anyOf: [{ type: "land", supertype: "basic" }, { subtype: "Gate" }] },
    destination: "battlefield",
    enterTapped: true,
    min: 0,
    max: 2,
  },
});
