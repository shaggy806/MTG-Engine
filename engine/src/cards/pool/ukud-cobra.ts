import { defineCard } from "../define.js";

export default defineCard({
  name: "Ukud Cobra",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 2,
  toughness: 5,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
