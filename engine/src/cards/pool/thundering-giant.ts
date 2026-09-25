import { defineCard } from "../define.js";

export default defineCard({
  name: "Thundering Giant",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 4,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste (This creature can attack and {T} as soon as it comes under your control.)",
});
