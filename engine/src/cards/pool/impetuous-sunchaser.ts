import { defineCard } from "../define.js";

export default defineCard({
  name: "Impetuous Sunchaser",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "haste"],
  text: "Flying, haste\nThis creature attacks each combat if able.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
