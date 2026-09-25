import { defineCard } from "../define.js";

export default defineCard({
  name: "Thornweald Archer",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Archer"],
  power: 2,
  toughness: 1,
  keywords: ["reach", "deathtouch"],
  text: "Reach (This creature can block creatures with flying.)\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
