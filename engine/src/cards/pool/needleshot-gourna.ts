import { defineCard } from "../define.js";

export default defineCard({
  name: "Needleshot Gourna",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 3,
  toughness: 6,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
