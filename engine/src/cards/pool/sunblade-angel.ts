import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunblade Angel",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "first-strike", "vigilance", "lifelink"],
  text: "Flying, first strike, vigilance, lifelink",
});
