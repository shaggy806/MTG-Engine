import { defineCard } from "../define.js";

export default defineCard({
  name: "Alaborn Musketeer",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 1,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});
