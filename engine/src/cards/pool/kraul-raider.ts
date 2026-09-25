import { defineCard } from "../define.js";

export default defineCard({
  name: "Kraul Raider",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect", "Warrior"],
  power: 2,
  toughness: 3,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
});
