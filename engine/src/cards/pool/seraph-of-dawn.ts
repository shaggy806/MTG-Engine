import { defineCard } from "../define.js";

export default defineCard({
  name: "Seraph of Dawn",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 2,
  toughness: 4,
  keywords: ["flying", "lifelink"],
  text: "Flying, lifelink",
});
