import { defineCard } from "../define.js";

// EDHREC rank 5163.
// Skyshroud Claim's shape, with the finds entering tapped.

export default defineCard({
  name: "Ranger's Path",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for up to two Forest cards, put them onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "land", subtype: "Forest" },
    destination: "battlefield",
    min: 0,
    max: 2,
    enterTapped: true,
  },
});
