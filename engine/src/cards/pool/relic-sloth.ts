import { defineCard } from "../define.js";

export default defineCard({
  name: "Relic Sloth",
  manaCost: "{3}{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Sloth", "Beast"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance", "menace"],
  text: "Vigilance\nMenace (This creature can't be blocked except by two or more creatures.)",
});
