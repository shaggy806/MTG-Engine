import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyraker Giant",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 4,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
