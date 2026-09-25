import { defineCard } from "../define.js";

export default defineCard({
  name: "Towering Indrik",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
