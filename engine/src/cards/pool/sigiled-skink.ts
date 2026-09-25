import { defineCard } from "../define.js";

export default defineCard({
  name: "Sigiled Skink",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard"],
  power: 2,
  toughness: 1,
  text: "Whenever this creature attacks, scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
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
