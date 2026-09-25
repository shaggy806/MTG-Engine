import { defineCard } from "../define.js";

export default defineCard({
  name: "Glacial Wall",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 7,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
