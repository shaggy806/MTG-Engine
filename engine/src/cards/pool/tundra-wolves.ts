import { defineCard } from "../define.js";

export default defineCard({
  name: "Tundra Wolves",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike (This creature deals combat damage before creatures without first strike.)",
});
