import { defineCard } from "../define.js";

export default defineCard({
  name: "Reckless Barbarian",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon", "Barbarian"],
  power: 2,
  toughness: 2,
  text: "Sacrifice this creature: Add {R}{R}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 2 },
      resolve: null,
      text: "Sacrifice this creature: Add {R}{R}.",
    },
  ],
});
