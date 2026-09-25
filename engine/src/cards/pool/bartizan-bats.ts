import { defineCard } from "../define.js";

export default defineCard({
  name: "Bartizan Bats",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Bat"],
  power: 3,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)",
});
