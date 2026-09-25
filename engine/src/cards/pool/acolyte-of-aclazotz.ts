import { defineCard } from "../define.js";

export default defineCard({
  name: "Acolyte of Aclazotz",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 1,
  toughness: 4,
  text: "{T}, Sacrifice another creature or artifact: Each opponent loses 1 life and you gain 1 life.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        sacrifice: { filter: { typesAnyOf: ["creature", "artifact"] } },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "{T}, Sacrifice another creature or artifact: Each opponent loses 1 life and you gain 1 life.",
      otherOnly: true,
    },
  ],
});
