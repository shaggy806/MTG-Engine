import { defineCard } from "../define.js";

export default defineCard({
  name: "Anaba Bodyguard",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur"],
  power: 2,
  toughness: 3,
  keywords: ["first-strike"],
  text: "First strike (This creature deals combat damage before creatures without first strike.)",
});
