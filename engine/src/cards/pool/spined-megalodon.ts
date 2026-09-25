import { defineCard } from "../define.js";

export default defineCard({
  name: "Spined Megalodon",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shark"],
  power: 5,
  toughness: 7,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)\nWhenever this creature attacks, scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "Whenever this creature attacks, scry 1.",
    },
  ],
});
