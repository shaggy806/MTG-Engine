import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Torches",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 4,
  toughness: 1,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
