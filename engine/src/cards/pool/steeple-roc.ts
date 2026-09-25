import { defineCard } from "../define.js";

export default defineCard({
  name: "Steeple Roc",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 3,
  toughness: 1,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike",
});
