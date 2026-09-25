import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Air",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 1,
  toughness: 5,
  keywords: ["defender", "flying"],
  text: "Defender, flying (This creature can't attack, and it can block creatures with flying.)",
});
