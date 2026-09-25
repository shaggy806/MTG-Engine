import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Heat",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 2,
  toughness: 6,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
