import { defineCard } from "../define.js";

export default defineCard({
  name: "Oashra Cultivator",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 0,
  toughness: 3,
  text: "{2}{G}, {T}, Sacrifice this creature: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: true, sacrifice: "self" },
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
      text: "{2}{G}, {T}, Sacrifice this creature: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
