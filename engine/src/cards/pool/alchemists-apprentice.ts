import { defineCard } from "../define.js";

export default defineCard({
  name: "Alchemist's Apprentice",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "Sacrifice this creature: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Sacrifice this creature: Draw a card.",
    },
  ],
});
