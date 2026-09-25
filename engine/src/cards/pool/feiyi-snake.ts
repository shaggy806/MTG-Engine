import { defineCard } from "../define.js";

export default defineCard({
  name: "Feiyi Snake",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 2,
  toughness: 1,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
