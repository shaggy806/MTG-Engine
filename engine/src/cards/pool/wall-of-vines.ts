import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Vines",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Wall"],
  power: 0,
  toughness: 3,
  keywords: ["defender", "reach"],
  text: "Defender (This creature can't attack.)\nReach (This creature can block creatures with flying.)",
});
