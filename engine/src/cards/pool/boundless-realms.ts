import { defineCard } from "../define.js";

// EDHREC rank 5942.
//
// Rulings:
//   [2012-07-01] The number of basic land cards you put onto the battlefield is equal to the
//     number of lands you control when Boundless Realms begins resolving.
//
// Harvest Season's shape: `max` is read as the search applies, the first and
// only step of the resolution.
export default defineCard({
  name: "Boundless Realms",
  manaCost: "{6}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for up to X basic land cards, where X is the number of lands you control, put them onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    min: 0,
    max: { countOf: { type: "land", controlledBy: "you" } },
    destination: "battlefield",
    enterTapped: true,
  },
});
