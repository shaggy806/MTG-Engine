import { defineCard } from "../define.js";

export default defineCard({
  name: "Fear of Surveillance",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Nightmare"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance\nWhenever this creature attacks, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
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
