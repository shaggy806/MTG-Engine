import { defineCard } from "../define.js";

export default defineCard({
  name: "Kessig Recluse",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 2,
  toughness: 3,
  keywords: ["reach", "deathtouch"],
  text: "Reach (This creature can block creatures with flying.)\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
