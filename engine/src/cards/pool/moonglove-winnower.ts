import { defineCard } from "../define.js";

export default defineCard({
  name: "Moonglove Winnower",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Rogue"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)",
});
