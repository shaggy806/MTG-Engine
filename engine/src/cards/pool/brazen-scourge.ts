import { defineCard } from "../define.js";

export default defineCard({
  name: "Brazen Scourge",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Gremlin"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste (This creature can attack and {T} as soon as it comes under your control.)",
});
