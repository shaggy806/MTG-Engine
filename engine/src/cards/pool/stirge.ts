import { defineCard } from "../define.js";

export default defineCard({
  name: "Stirge",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect", "Bat"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nThis creature can't block.\nBlood Drain — {1}{B}, Pay 1 life, Sacrifice this creature: Draw a card.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false, payLife: 1, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Blood Drain — {1}{B}, Pay 1 life, Sacrifice this creature: Draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
