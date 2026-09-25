import { defineCard } from "../define.js";

export default defineCard({
  name: "Arachnoid",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Spider"],
  power: 2,
  toughness: 6,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
