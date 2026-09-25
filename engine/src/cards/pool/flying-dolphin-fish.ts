import { defineCard } from "../define.js";

export default defineCard({
  name: "Flying Dolphin-Fish",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Whale", "Fish"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)",
});
