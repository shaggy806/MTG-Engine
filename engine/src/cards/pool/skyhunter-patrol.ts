import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyhunter Patrol",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Knight"],
  power: 2,
  toughness: 3,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike (This creature can't be blocked except by creatures with flying or reach, and it deals combat damage before creatures without first strike.)",
});
