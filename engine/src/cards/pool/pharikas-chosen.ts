import { defineCard } from "../define.js";

export default defineCard({
  name: "Pharika's Chosen",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
