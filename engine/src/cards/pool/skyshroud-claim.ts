import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyshroud Claim",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for up to two Forest cards, put them onto the battlefield, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "land", subtype: "Forest" },
    destination: "battlefield",
    min: 0,
    max: 2,
  },
});
