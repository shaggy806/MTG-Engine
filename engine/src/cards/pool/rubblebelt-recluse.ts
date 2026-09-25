import { defineCard } from "../define.js";

export default defineCard({
  name: "Rubblebelt Recluse",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre", "Berserker"],
  power: 6,
  toughness: 5,
  text: "This creature attacks each combat if able.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
