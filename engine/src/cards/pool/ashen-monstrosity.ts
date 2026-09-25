import { defineCard } from "../define.js";

export default defineCard({
  name: "Ashen Monstrosity",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 7,
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
