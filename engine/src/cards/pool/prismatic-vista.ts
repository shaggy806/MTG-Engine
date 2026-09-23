import { defineCard } from "../define.js";

const TEXT =
  "{T}, Pay 1 life, Sacrifice this land: Search your library for a basic land card, put it onto the battlefield, then shuffle.";

// A fetch land for any basic: `fetchLand`'s cost with Evolving Wilds' filter,
// and the find enters untapped.
export default defineCard({
  name: "Prismatic Vista",
  colors: [],
  types: ["land"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self", payLife: 1 },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
