import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyhunter Skirmisher",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Knight"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "double-strike"],
  text: "Flying, double strike",
});
