import { defineCard } from "../define.js";

export default defineCard({
  name: "Ripscale Predator",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 6,
  toughness: 5,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
});
