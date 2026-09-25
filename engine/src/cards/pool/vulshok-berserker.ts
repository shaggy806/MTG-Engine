import { defineCard } from "../define.js";

export default defineCard({
  name: "Vulshok Berserker",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Berserker"],
  power: 3,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste (This creature can attack and {T} as soon as it comes under your control.)",
});
