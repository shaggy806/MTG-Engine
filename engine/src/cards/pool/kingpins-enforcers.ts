import { defineCard } from "../define.js";

export default defineCard({
  name: "Kingpin's Enforcers",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Villain"],
  power: 2,
  toughness: 3,
  keywords: ["lifelink"],
  text: "Lifelink\n{2}{B}, Sacrifice an artifact or creature: Draw a card.",
  activated: [
    {
      cost: {
        mana: "{2}{B}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["artifact", "creature"] } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{B}, Sacrifice an artifact or creature: Draw a card.",
    },
  ],
});
