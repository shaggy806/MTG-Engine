import { defineCard } from "../define.js";

export default defineCard({
  name: "A.I.M. Bot",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Villain"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)",
});
