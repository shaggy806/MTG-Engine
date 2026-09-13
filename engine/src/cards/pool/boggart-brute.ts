import { defineCard } from "../define.js";

export default defineCard({
  name: "Boggart Brute",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 3,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace",
});
