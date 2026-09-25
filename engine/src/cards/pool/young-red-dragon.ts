import { defineCard } from "../define.js";

export default defineCard({
  name: "Young Red Dragon",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
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
  faces: ["Young Red Dragon", "Bathe in Gold"],
  adventure: true,
});
