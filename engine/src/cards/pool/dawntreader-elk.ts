import { defineCard } from "../define.js";

export default defineCard({
  name: "Dawntreader Elk",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elk"],
  power: 2,
  toughness: 2,
  text: "{G}, Sacrifice this creature: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: "{G}", tap: false, sacrifice: "self" },
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
      text: "{G}, Sacrifice this creature: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
