import { defineCard } from "../define.js";

export default defineCard({
  name: "Elephant-Rat",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elephant", "Rat"],
  power: 1,
  toughness: 3,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
});
