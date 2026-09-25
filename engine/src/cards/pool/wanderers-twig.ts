import { defineCard } from "../define.js";

export default defineCard({
  name: "Wanderer's Twig",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{1}, Sacrifice this artifact: Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
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
      text: "{1}, Sacrifice this artifact: Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
