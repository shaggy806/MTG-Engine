import { defineCard } from "../define.js";

export default defineCard({
  name: "Quicksilver, Pietro Maximoff",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Hero"],
  power: 3,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste (This creature can attack and {T} as soon as he comes under your control.)",
});
