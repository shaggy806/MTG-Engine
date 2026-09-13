import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Raider",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 2,
  toughness: 2,
  text: "This creature can't block.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "Goblin Raider can't block.",
    },
  ],
});
