import { defineCard } from "../define.js";

export default defineCard({
  name: "Canopy Spider",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 1,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
