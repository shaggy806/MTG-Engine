import { defineCard } from "../define.js";

export default defineCard({
  name: "Giant Scorpion",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Scorpion"],
  power: 1,
  toughness: 3,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
