import { defineCard } from "../define.js";

export default defineCard({
  name: "Boggart Brute",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 3,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace",
});
