import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon's Eye Sentry",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 1,
  toughness: 3,
  keywords: ["defender", "first-strike"],
  text: "Defender, first strike",
});
