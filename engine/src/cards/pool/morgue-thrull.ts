import { defineCard } from "../define.js";

export default defineCard({
  name: "Morgue Thrull",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Thrull"],
  power: 2,
  toughness: 2,
  text: "Sacrifice this creature: Mill three cards.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: "Sacrifice this creature: Mill three cards.",
    },
  ],
});
