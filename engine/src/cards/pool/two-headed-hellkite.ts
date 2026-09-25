import { defineCard } from "../define.js";

export default defineCard({
  name: "Two-Headed Hellkite",
  manaCost: "{1}{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "menace", "haste"],
  text: "Flying, menace, haste\nWhenever this creature attacks, draw two cards.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "Whenever this creature attacks, draw two cards.",
    },
  ],
});
