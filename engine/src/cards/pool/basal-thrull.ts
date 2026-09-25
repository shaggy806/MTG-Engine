import { defineCard } from "../define.js";

export default defineCard({
  name: "Basal Thrull",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Thrull"],
  power: 1,
  toughness: 2,
  text: "{T}, Sacrifice this creature: Add {B}{B}.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 2 },
      resolve: null,
      text: "{T}, Sacrifice this creature: Add {B}{B}.",
    },
  ],
});
