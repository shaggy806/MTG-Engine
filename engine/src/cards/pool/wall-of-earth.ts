import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Earth",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 6,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
