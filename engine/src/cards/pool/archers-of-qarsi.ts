import { defineCard } from "../define.js";

export default defineCard({
  name: "Archers of Qarsi",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Archer"],
  power: 5,
  toughness: 2,
  keywords: ["defender", "reach"],
  text: "Defender\nReach (This creature can block creatures with flying.)",
});
