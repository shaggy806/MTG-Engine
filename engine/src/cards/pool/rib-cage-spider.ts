import { defineCard } from "../define.js";

export default defineCard({
  name: "Rib Cage Spider",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 1,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
