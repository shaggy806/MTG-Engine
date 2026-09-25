import { defineCard } from "../define.js";

export default defineCard({
  name: "Goldhound",
  manaCost: "{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Treasure", "Dog"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike", "menace"],
  text: "First strike\nMenace (This creature can't be blocked except by two or more creatures.)\n{T}, Sacrifice this creature: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Sacrifice this creature: Add one mana of any color.",
    },
  ],
});
