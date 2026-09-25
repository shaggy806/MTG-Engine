import { defineCard } from "../define.js";

export default defineCard({
  name: "Midnight Assassin",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Assassin"],
  power: 1,
  toughness: 2,
  keywords: ["flying", "deathtouch"],
  text: "Flying\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
