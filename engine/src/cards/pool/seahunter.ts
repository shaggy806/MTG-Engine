import { defineCard } from "../define.js";

export default defineCard({
  name: "Seahunter",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Mercenary"],
  power: 2,
  toughness: 2,
  text: "{3}, {T}: Search your library for a Merfolk permanent card, put it onto the battlefield, then shuffle.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Merfolk", notTypes: ["instant", "sorcery"] },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "{3}, {T}: Search your library for a Merfolk permanent card, put it onto the battlefield, then shuffle.",
    },
  ],
});
