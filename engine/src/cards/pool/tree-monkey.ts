import { defineCard } from "../define.js";

export default defineCard({
  name: "Tree Monkey",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Monkey"],
  power: 1,
  toughness: 1,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
