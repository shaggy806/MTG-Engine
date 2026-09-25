import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Deathraiders",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 3,
  toughness: 1,
  keywords: ["trample"],
  text: "Trample",
});
