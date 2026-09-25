import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashino Runner",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard"],
  power: 3,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
});
