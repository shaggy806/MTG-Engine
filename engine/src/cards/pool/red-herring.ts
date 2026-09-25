import { defineCard } from "../define.js";

export default defineCard({
  name: "Red Herring",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Clue", "Fish"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste\nThis creature attacks each combat if able.\n{2}, Sacrifice this creature: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, Sacrifice this creature: Draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
