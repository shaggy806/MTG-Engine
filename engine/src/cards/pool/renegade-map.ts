import { defineCard } from "../define.js";

export default defineCard({
  name: "Renegade Map",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "This artifact enters tapped.\n{T}, Sacrifice this artifact: Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
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
      text: "{T}, Sacrifice this artifact: Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This artifact enters tapped.",
    },
  ],
});
