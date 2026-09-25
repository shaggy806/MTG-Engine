import { defineCard } from "../define.js";

export default defineCard({
  name: "Norwood Archers",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Archer"],
  power: 3,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
