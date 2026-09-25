import { defineCard } from "../define.js";

export default defineCard({
  name: "Goliath Spider",
  manaCost: "{6}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 7,
  toughness: 6,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
