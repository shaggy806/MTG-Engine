import { defineCard } from "../define.js";

export default defineCard({
  name: "Pyromantic Pilgrim",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste (This creature can attack and {T} as soon as it comes under your control.)",
});
