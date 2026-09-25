import { defineCard } from "../define.js";

export default defineCard({
  name: "Order of Midnight",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nThis creature can't block.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
  faces: ["Order of Midnight", "Alter Fate"],
  adventure: true,
});
