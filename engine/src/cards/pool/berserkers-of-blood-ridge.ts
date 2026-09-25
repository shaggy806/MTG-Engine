import { defineCard } from "../define.js";

export default defineCard({
  name: "Berserkers of Blood Ridge",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Berserker"],
  power: 4,
  toughness: 4,
  text: "This creature attacks each combat if able.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
