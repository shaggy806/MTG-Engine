import { defineCard } from "../define.js";

export default defineCard({
  name: "Planar Bridge",
  manaCost: "{6}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: "{8}, {T}: Search your library for a permanent card, put it onto the battlefield, then shuffle.",
  activated: [
    {
      cost: { mana: "{8}", tap: true },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { notTypes: ["instant", "sorcery"] },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "{8}, {T}: Search your library for a permanent card, put it onto the battlefield, then shuffle.",
    },
  ],
});
