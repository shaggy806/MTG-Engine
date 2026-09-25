import { defineCard } from "../define.js";

export default defineCard({
  name: "Iron-Barb Hellion",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Hellion", "Beast"],
  power: 5,
  toughness: 4,
  keywords: ["haste"],
  text: "Haste\nThis creature can't block.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
