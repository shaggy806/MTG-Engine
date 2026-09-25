import { defineCard } from "../define.js";

export default defineCard({
  name: "Tidehollow Strix",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["artifact", "creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 1,
  keywords: ["flying", "deathtouch"],
  text: "Flying\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
