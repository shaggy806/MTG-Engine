import { defineCard } from "../define.js";

export default defineCard({
  name: "Slagdrill Scrapper",
  manaCost: "{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Scout"],
  power: 1,
  toughness: 2,
  text: "{2}, {T}, Sacrifice another artifact or land: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: { filter: { typesAnyOf: ["artifact", "land"] } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, {T}, Sacrifice another artifact or land: Draw a card.",
      otherOnly: true,
    },
  ],
});
