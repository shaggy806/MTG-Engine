import { defineCard } from "../define.js";

const TEXT =
  "{G}, Discard a creature card: Search your library for a creature card, reveal that card, put it into your hand, then shuffle.";

export default defineCard({
  name: "Survival of the Fittest",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{G}", tap: false, discard: { count: 1, filter: { type: "creature" } } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "creature" },
        destination: "hand",
        reveal: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
