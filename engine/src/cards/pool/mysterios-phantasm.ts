import { defineCard } from "../define.js";

export default defineCard({
  name: "Mysterio's Phantasm",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Illusion", "Villain"],
  power: 1,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance\nWhenever this creature attacks, mill a card. (Put the top card of your library into your graveyard.)",
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
