import { defineCard } from "../define.js";

export default defineCard({
  name: "Oscorp Research Team",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Scientist"],
  power: 1,
  toughness: 5,
  text: "{6}{U}: Draw two cards.",
  activated: [
    {
      cost: { mana: "{6}{U}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{6}{U}: Draw two cards.",
    },
  ],
});
