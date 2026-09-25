import { defineCard } from "../define.js";

export default defineCard({
  name: "Scavenging Scarab",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 3,
  toughness: 3,
  text: "This creature can't block.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
