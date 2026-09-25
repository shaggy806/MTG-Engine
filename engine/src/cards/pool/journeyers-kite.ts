import { defineCard } from "../define.js";

export default defineCard({
  name: "Journeyer's Kite",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{3}, {T}: Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "{3}, {T}: Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
