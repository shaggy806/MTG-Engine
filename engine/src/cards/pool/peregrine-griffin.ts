import { defineCard } from "../define.js";

export default defineCard({
  name: "Peregrine Griffin",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 2,
  toughness: 4,
  keywords: ["flying", "first-strike"],
  text: "Flying\nFirst strike (This creature deals combat damage before creatures without first strike.)",
});
