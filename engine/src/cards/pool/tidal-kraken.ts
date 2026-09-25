import { defineCard } from "../define.js";

export default defineCard({
  name: "Tidal Kraken",
  manaCost: "{5}{U}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kraken"],
  power: 6,
  toughness: 6,
  text: "This creature can't be blocked.",
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: "This creature can't be blocked.",
    },
  ],
});
