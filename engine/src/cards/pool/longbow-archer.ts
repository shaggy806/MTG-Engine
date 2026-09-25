import { defineCard } from "../define.js";

export default defineCard({
  name: "Longbow Archer",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Archer"],
  power: 2,
  toughness: 2,
  keywords: ["reach", "first-strike"],
  text: "Reach (This creature can block creatures with flying.)\nFirst strike",
});
