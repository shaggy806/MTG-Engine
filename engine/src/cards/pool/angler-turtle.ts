import { defineCard } from "../define.js";

const ATTACK_TEXT = "Creatures your opponents control attack each combat if able.";

export default defineCard({
  name: "Angler Turtle",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Turtle"],
  power: 5,
  toughness: 7,
  keywords: ["hexproof"],
  text: `Hexproof\n${ATTACK_TEXT}`,
  static: [
    {
      // Each opponent's creatures, wherever they came from, while the Turtle
      // is here; whom they attack is their controller's choice (rule 508.1d).
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "opponent" } },
      restrictions: ["must-attack"],
      text: ATTACK_TEXT,
    },
  ],
});
