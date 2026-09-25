import { defineCard } from "../define.js";

export default defineCard({
  name: "Moat Piranhas",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Fish"],
  power: 3,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
