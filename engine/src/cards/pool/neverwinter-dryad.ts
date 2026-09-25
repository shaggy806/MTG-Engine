import { defineCard } from "../define.js";

export default defineCard({
  name: "Neverwinter Dryad",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 1,
  toughness: 1,
  text: "{2}, Sacrifice this creature: Search your library for a basic Forest card, put it onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtype: "Forest" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: "{2}, Sacrifice this creature: Search your library for a basic Forest card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
