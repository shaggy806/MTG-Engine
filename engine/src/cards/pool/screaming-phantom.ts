import { defineCard } from "../define.js";

export default defineCard({
  name: "Screaming Phantom",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, mill a card. (Put the top card of your library into your graveyard.)",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 1 },
      resolve: null,
      text: "Whenever this creature attacks, mill a card.",
    },
  ],
});
