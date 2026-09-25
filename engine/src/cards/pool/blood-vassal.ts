import { defineCard } from "../define.js";

export default defineCard({
  name: "Blood Vassal",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Thrull"],
  power: 2,
  toughness: 2,
  text: "Sacrifice this creature: Add {B}{B}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 2 },
      resolve: null,
      text: "Sacrifice this creature: Add {B}{B}.",
    },
  ],
});
