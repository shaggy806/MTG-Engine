import { defineCard } from "../define.js";

export default defineCard({
  name: "Alley Strangler",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Aetherborn", "Rogue"],
  power: 2,
  toughness: 3,
  keywords: ["menace"],
  text: "Menace",
});
