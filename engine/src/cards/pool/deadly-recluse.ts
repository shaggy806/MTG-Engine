import { defineCard } from "../define.js";

export default defineCard({
  name: "Deadly Recluse",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 1,
  toughness: 2,
  keywords: ["reach", "deathtouch"],
  text: "Reach (This creature can block creatures with flying.)\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
