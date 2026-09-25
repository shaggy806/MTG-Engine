import { defineCard } from "../define.js";

export default defineCard({
  name: "Hostile Minotaur",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste (This creature can attack and {T} as soon as it comes under your control.)",
});
