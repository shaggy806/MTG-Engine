import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Swords",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 3,
  toughness: 5,
  keywords: ["defender", "flying"],
  text: "Defender (This creature can't attack.)\nFlying",
});
