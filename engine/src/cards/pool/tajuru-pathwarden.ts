import { defineCard } from "../define.js";

export default defineCard({
  name: "Tajuru Pathwarden",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior", "Ally"],
  power: 5,
  toughness: 4,
  keywords: ["vigilance", "trample"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)\nTrample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)",
});
