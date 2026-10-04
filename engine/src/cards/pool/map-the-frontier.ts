import { defineCard } from "../define.js";

// EDHREC rank 3649.
//
// "Basic land cards and/or Desert cards": any mix of the two, up to two in
// all — one filter with an `anyOf`.
export default defineCard({
  name: "Map the Frontier",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for up to two basic land cards and/or Desert cards, put them onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { anyOf: [{ supertype: "basic", type: "land" }, { subtype: "Desert" }] },
    destination: "battlefield",
    enterTapped: true,
    min: 0,
    max: 2,
  },
});
