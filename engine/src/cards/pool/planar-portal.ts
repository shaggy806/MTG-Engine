import { defineCard } from "../define.js";

export default defineCard({
  name: "Planar Portal",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  text: "{6}, {T}: Search your library for a card, put that card into your hand, then shuffle.",
  activated: [
    {
      cost: { mana: "{6}", tap: true },
      targets: [],
      effect: { kind: "search-library", filter: {}, destination: "hand", min: 0, max: 1 },
      resolve: null,
      text: "{6}, {T}: Search your library for a card, put that card into your hand, then shuffle.",
    },
  ],
});
