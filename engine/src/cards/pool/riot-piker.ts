import { defineCard } from "../define.js";

export default defineCard({
  name: "Riot Piker",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Berserker"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike\nThis creature attacks each combat if able.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
