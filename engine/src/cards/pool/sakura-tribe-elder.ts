import { defineCard } from "../define.js";

export default defineCard({
  name: "Sakura-Tribe Elder",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Shaman"],
  power: 1,
  toughness: 1,
  text:
    "Sacrifice Sakura-Tribe Elder: Search your library for a basic land card, " +
    "put that card onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
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
      text:
        "Sacrifice Sakura-Tribe Elder: Search your library for a basic land card, " +
        "put that card onto the battlefield tapped, then shuffle.",
    },
  ],
});
