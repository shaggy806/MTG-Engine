import { defineCard } from "../define.js";

export default defineCard({
  name: "Blistering Barrier",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 5,
  toughness: 2,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
