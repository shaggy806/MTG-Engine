import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyshroud Poacher",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Rebel"],
  power: 2,
  toughness: 2,
  text: "{3}, {T}: Search your library for an Elf permanent card, put it onto the battlefield, then shuffle.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Elf", notTypes: ["instant", "sorcery"] },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "{3}, {T}: Search your library for an Elf permanent card, put it onto the battlefield, then shuffle.",
    },
  ],
});
