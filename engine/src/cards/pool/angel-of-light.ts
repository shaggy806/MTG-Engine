import { defineCard } from "../define.js";

export default defineCard({
  name: "Angel of Light",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
