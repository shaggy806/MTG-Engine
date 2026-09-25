import { defineCard } from "../define.js";

export default defineCard({
  name: "Warclamp Mastiff",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike (This creature deals combat damage before creatures without first strike.)",
});
