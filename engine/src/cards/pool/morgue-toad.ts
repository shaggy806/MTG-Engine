import { defineCard } from "../define.js";

export default defineCard({
  name: "Morgue Toad",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Frog"],
  power: 2,
  toughness: 2,
  text: "Sacrifice this creature: Add {U}{R}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["U", "R"] }, amount: 1 },
      resolve: null,
      text: "Sacrifice this creature: Add {U}{R}.",
    },
  ],
});
