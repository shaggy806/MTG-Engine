import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashino Spearhunter",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Warrior"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike (This creature deals combat damage before creatures without first strike.)",
});
