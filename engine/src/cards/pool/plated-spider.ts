import { defineCard } from "../define.js";

export default defineCard({
  name: "Plated Spider",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 4,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
