import { defineCard } from "../define.js";

export default defineCard({
  name: "Feral Abomination",
  manaCost: "{5}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Thrull"],
  power: 5,
  toughness: 5,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
