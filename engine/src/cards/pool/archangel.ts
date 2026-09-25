import { defineCard } from "../define.js";

export default defineCard({
  name: "Archangel",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
