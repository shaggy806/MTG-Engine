import { defineCard } from "../define.js";

export default defineCard({
  name: "Cloudcrown Oak",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk", "Warrior"],
  power: 3,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
