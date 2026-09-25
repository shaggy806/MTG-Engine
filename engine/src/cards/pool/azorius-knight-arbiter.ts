import { defineCard } from "../define.js";

export default defineCard({
  name: "Azorius Knight-Arbiter",
  manaCost: "{3}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 5,
  keywords: ["vigilance"],
  text: "Vigilance\nThis creature can't be blocked.",
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: "This creature can't be blocked.",
    },
  ],
});
