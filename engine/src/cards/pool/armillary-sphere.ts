import { defineCard } from "../define.js";

const TEXT =
  "{2}, {T}, Sacrifice this artifact: Search your library for up to two basic land cards, reveal them, put them into your hand, then shuffle.";

export default defineCard({
  name: "Armillary Sphere",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "hand",
        reveal: true,
        min: 0,
        max: 2,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
