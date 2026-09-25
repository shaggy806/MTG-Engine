import { defineCard } from "../define.js";

export default defineCard({
  name: "Angelic Wall",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender", "flying"],
  text: "Defender (This creature can't attack.)\nFlying",
});
