import { defineCard } from "../define.js";

export default defineCard({
  name: "Razorfoot Griffin",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "first-strike"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)\nFirst strike (This creature deals combat damage before creatures without first strike.)",
});
