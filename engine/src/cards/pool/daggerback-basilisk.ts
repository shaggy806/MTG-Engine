import { defineCard } from "../define.js";

export default defineCard({
  name: "Daggerback Basilisk",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Basilisk"],
  power: 2,
  toughness: 2,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
