import { defineCard } from "../define.js";

export default defineCard({
  name: "Boulderborn Dragon",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance\nWhenever this creature attacks, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "Whenever this creature attacks, surveil 1.",
    },
  ],
});
