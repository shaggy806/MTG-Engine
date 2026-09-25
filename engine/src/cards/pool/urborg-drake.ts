import { defineCard } from "../define.js";

export default defineCard({
  name: "Urborg Drake",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 3,
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
