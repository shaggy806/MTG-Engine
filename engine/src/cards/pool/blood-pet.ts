import { defineCard } from "../define.js";

export default defineCard({
  name: "Blood Pet",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Thrull"],
  power: 1,
  toughness: 1,
  text: "Sacrifice this creature: Add {B}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "Sacrifice this creature: Add {B}.",
    },
  ],
});
