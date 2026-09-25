import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodrock Cyclops",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Cyclops"],
  power: 3,
  toughness: 3,
  text: "This creature attacks each combat if able.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
