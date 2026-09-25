import { defineCard } from "../define.js";

export default defineCard({
  name: "Deathgaze Cockatrice",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Cockatrice"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "deathtouch"],
  text: "Flying\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
