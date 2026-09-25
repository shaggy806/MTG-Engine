import { defineCard } from "../define.js";

export default defineCard({
  name: "Dockside Chef",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Human", "Citizen"],
  power: 1,
  toughness: 2,
  text: "{1}{B}, Sacrifice an artifact or creature: Draw a card.",
  activated: [
    {
      cost: {
        mana: "{1}{B}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["artifact", "creature"] } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}{B}, Sacrifice an artifact or creature: Draw a card.",
    },
  ],
});
