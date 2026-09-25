import { defineCard } from "../define.js";

export default defineCard({
  name: "Shrike Force",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird", "Knight"],
  power: 1,
  toughness: 3,
  keywords: ["flying", "double-strike", "vigilance"],
  text: "Flying, double strike, vigilance",
});
