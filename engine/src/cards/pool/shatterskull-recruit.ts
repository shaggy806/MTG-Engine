import { defineCard } from "../define.js";

export default defineCard({
  name: "Shatterskull Recruit",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Giant", "Warrior", "Ally"],
  power: 4,
  toughness: 4,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
});
