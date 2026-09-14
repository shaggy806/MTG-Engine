import { defineCard } from "../define.js";

export default defineCard({
  name: "Wayfarer's Bauble",
  manaCost: "{1}",
  types: ["artifact"],
  text:
    "{2}, {T}, Sacrifice Wayfarer's Bauble: Search your library for a basic land card, " +
    "put that card onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text:
        "{2}, {T}, Sacrifice Wayfarer's Bauble: Search your library for a basic land card, " +
        "put that card onto the battlefield tapped, then shuffle.",
    },
  ],
});
