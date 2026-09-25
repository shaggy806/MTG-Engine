import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Granite",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 7,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
