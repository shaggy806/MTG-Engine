import { defineCard } from "../define.js";

export default defineCard({
  name: "Cruel Witness",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Horror"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast a noncreature spell, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, surveil 1.",
    },
  ],
});
