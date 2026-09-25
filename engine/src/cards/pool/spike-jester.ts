import { defineCard } from "../define.js";

export default defineCard({
  name: "Spike Jester",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 3,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste",
});
