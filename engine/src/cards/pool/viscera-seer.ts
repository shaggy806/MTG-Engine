import { defineCard } from "../define.js";

export default defineCard({
  name: "Viscera Seer",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Wizard"],
  power: 1,
  toughness: 1,
  text: "Sacrifice a creature: Scry 1.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "Sacrifice a creature: Scry 1.",
    },
  ],
});
