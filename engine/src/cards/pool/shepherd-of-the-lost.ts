import { defineCard } from "../define.js";

export default defineCard({
  name: "Shepherd of the Lost",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "first-strike", "vigilance"],
  text: "Flying, first strike, vigilance",
});
