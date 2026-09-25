import { defineCard } from "../define.js";

export default defineCard({
  name: "Latch Seeker",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 3,
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
