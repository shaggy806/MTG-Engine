import { defineCard } from "../define.js";

export default defineCard({
  name: "Segovian Angel",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
