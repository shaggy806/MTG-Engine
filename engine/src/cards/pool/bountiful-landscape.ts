import { defineCard } from "../define.js";

export default defineCard({
  name: "Bountiful Landscape",
  types: ["land"],
  cycling: { cost: "{G}{U}{R}" },
  text:
    "{T}: Add {C}.\n" +
    "{T}, Sacrifice Bountiful Landscape: Search your library for a basic Forest, " +
    "Island, or Mountain card, put it onto the battlefield tapped, then shuffle.\n" +
    "Cycling {G}{U}{R}",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land", subtypes: ["Forest", "Island", "Mountain"] },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text:
        "{T}, Sacrifice Bountiful Landscape: Search your library for a basic Forest, " +
        "Island, or Mountain card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
