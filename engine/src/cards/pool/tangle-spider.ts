import { defineCard } from "../define.js";

export default defineCard({
  name: "Tangle Spider",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 3,
  toughness: 4,
  keywords: ["flash", "reach"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nReach (This creature can block creatures with flying.)",
});
