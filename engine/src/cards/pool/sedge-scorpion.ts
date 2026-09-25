import { defineCard } from "../define.js";

export default defineCard({
  name: "Sedge Scorpion",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Scorpion"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
