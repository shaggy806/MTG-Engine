import { defineCard } from "../define.js";

export default defineCard({
  name: "Silverbeak Griffin",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)",
});
