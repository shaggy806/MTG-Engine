import { defineCard } from "../define.js";

export default defineCard({
  name: "Daggerclaw Imp",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Imp"],
  power: 3,
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
