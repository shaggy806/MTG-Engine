import { defineCard } from "../define.js";

export default defineCard({
  name: "Cultivate",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for up to two basic land cards, reveal those cards, put one onto the battlefield tapped and the other into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    min: 0,
    max: 2,
    // The split: the first find goes to the battlefield tapped, the second
    // to hand. Finding only one puts it onto the battlefield, which is what
    // the card does.
    destination: "battlefield",
    enterTapped: true,
    restDestination: "hand",
  },
});
