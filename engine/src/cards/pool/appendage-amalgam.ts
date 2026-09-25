import { defineCard } from "../define.js";

export default defineCard({
  name: "Appendage Amalgam",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Horror"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nWhenever this creature attacks, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
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
