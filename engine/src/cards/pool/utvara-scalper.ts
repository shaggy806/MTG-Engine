import { defineCard } from "../define.js";

export default defineCard({
  name: "Utvara Scalper",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Scout"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nThis creature attacks each combat if able.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
