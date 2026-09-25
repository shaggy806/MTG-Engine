import { defineCard } from "../define.js";

export default defineCard({
  name: "Deer-Dog",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elk", "Dog"],
  power: 1,
  toughness: 3,
  keywords: ["first-strike"],
  text: "First strike (This creature deals combat damage before creatures without first strike.)",
});
