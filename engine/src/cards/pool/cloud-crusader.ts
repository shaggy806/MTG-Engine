import { defineCard } from "../define.js";

export default defineCard({
  name: "Cloud Crusader",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 3,
  keywords: ["flying", "first-strike"],
  text: "Flying\nFirst strike (This creature deals combat damage before creatures without first strike.)",
});
