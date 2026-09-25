import { defineCard } from "../define.js";

export default defineCard({
  name: "Ashenmoor Gouger",
  manaCost: "{B/R}{B/R}{B/R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Elemental", "Warrior"],
  power: 4,
  toughness: 4,
  text: "This creature can't block.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
