import { defineCard } from "../define.js";

export default defineCard({
  name: "Two-Headed Hunter",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 5,
  toughness: 4,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
  faces: ["Two-Headed Hunter", "Twice the Rage"],
  adventure: true,
});
