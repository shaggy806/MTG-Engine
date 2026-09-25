import { defineCard } from "../define.js";

export default defineCard({
  name: "Slippery Bogle",
  manaCost: "{G/U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 1,
  toughness: 1,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
