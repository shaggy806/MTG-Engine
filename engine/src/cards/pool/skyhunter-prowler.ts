import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyhunter Prowler",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Knight"],
  power: 1,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance (This creature can't be blocked except by creatures with flying or reach, and attacking doesn't cause this creature to tap.)",
});
