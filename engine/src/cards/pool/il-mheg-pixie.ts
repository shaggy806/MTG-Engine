import { defineCard } from "../define.js";

export default defineCard({
  name: "Il Mheg Pixie",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
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
