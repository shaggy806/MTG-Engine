import { defineCard } from "../define.js";

export default defineCard({
  name: "Dancing Scimitar",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)",
});
