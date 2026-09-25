import { defineCard } from "../define.js";

export default defineCard({
  name: "Flameborn Hellion",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Hellion"],
  power: 5,
  toughness: 4,
  keywords: ["haste"],
  text: "Haste\nThis creature attacks each combat if able.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
