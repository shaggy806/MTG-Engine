import { defineCard } from "../define.js";

export default defineCard({
  name: "Storm Crow",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)",
});
