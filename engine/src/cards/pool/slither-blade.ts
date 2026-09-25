import { defineCard } from "../define.js";

export default defineCard({
  name: "Slither Blade",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Snake", "Rogue"],
  power: 1,
  toughness: 2,
  text: "This creature can't be blocked.",
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: "This creature can't be blocked.",
    },
  ],
});
