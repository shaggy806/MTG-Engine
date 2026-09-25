import { defineCard } from "../define.js";

export default defineCard({
  name: "Frontier Guide",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 1,
  toughness: 1,
  text: "{3}{G}, {T}: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: "{3}{G}", tap: true },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: "{3}{G}, {T}: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
