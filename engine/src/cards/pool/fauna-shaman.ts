import { defineCard } from "../define.js";

const TEXT =
  "{G}, {T}, Discard a creature card: Search your library for a creature card, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Fauna Shaman",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{G}", tap: true, discard: { count: 1, filter: { type: "creature" } } },
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
