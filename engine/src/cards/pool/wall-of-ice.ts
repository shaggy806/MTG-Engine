import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Ice",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 7,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
