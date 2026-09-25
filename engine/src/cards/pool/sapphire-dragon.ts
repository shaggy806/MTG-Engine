import { defineCard } from "../define.js";

export default defineCard({
  name: "Sapphire Dragon",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks or blocks, scry 2.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "Whenever this creature attacks or blocks, scry 2.",
    },
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "Whenever this creature attacks or blocks, scry 2.",
    },
  ],
  faces: ["Sapphire Dragon", "Psionic Pulse"],
  adventure: true,
});
