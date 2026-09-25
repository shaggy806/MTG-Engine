import { defineCard } from "../define.js";

export default defineCard({
  name: "Anvilwrought Raptor",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 1,
  keywords: ["flying", "first-strike"],
  text: "Flying\nFirst strike (This creature deals combat damage before creatures without first strike.)",
});
