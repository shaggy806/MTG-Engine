import { defineCard } from "../define.js";

export default defineCard({
  name: "Phantom Warrior",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Illusion", "Warrior"],
  power: 2,
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
