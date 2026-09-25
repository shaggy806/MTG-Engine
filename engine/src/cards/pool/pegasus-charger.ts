import { defineCard } from "../define.js";

export default defineCard({
  name: "Pegasus Charger",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Pegasus"],
  power: 2,
  toughness: 1,
  keywords: ["flying", "first-strike"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)\nFirst strike (This creature deals combat damage before creatures without first strike.)",
});
