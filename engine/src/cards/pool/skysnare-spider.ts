import { defineCard } from "../define.js";

export default defineCard({
  name: "Skysnare Spider",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 6,
  toughness: 6,
  keywords: ["vigilance", "reach"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)\nReach (This creature can block creatures with flying.)",
});
