import { defineCard } from "../define.js";

export default defineCard({
  name: "Consulate Skygate",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender", "reach"],
  text: "Defender\nReach (This creature can block creatures with flying.)",
});
