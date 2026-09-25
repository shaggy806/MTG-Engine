import { defineCard } from "../define.js";

export default defineCard({
  name: "Metathran Soldier",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Metathran", "Soldier"],
  power: 1,
  toughness: 1,
  text: "This creature can't be blocked.",
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: "This creature can't be blocked.",
    },
  ],
});
