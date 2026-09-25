import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Razors",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 4,
  toughness: 1,
  keywords: ["defender", "first-strike"],
  text: "Defender (This creature can't attack.)\nFirst strike",
});
