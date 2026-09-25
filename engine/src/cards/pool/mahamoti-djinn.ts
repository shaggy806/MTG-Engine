import { defineCard } from "../define.js";

export default defineCard({
  name: "Mahamoti Djinn",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Djinn"],
  power: 5,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)",
});
