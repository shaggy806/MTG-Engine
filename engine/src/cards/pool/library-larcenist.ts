import { defineCard } from "../define.js";

export default defineCard({
  name: "Library Larcenist",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Rogue"],
  power: 1,
  toughness: 2,
  text: "Whenever this creature attacks, draw a card.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever this creature attacks, draw a card.",
    },
  ],
});
