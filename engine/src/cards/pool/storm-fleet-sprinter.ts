import { defineCard } from "../define.js";

export default defineCard({
  name: "Storm Fleet Sprinter",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste\nThis creature can't be blocked.",
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: "This creature can't be blocked.",
    },
  ],
});
