import { defineCard } from "../define.js";

export default defineCard({
  name: "Rimrock Knight",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dwarf", "Knight"],
  power: 3,
  toughness: 1,
  text: "This creature can't block.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
  faces: ["Rimrock Knight", "Boulder Rush"],
  adventure: true,
});
