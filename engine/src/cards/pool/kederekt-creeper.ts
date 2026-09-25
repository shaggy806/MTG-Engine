import { defineCard } from "../define.js";

export default defineCard({
  name: "Kederekt Creeper",
  manaCost: "{U}{B}{R}",
  colors: ["U", "B", "R"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 2,
  toughness: 3,
  keywords: ["menace", "deathtouch"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
