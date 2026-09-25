import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Stone",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 8,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
