import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampire Interloper",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Scout"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nThis creature can't block.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
