import { defineCard } from "../define.js";

export default defineCard({
  name: "Embodiment of Spring",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 0,
  toughness: 3,
  text: "{1}{G}, {T}, Sacrifice this creature: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: true, sacrifice: "self" },
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
      text: "{1}{G}, {T}, Sacrifice this creature: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
