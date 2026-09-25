import { defineCard } from "../define.js";

export default defineCard({
  name: "Keen-Eyed Archers",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elf", "Archer"],
  power: 2,
  toughness: 2,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
