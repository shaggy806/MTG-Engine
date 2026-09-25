import { defineCard } from "../define.js";

export default defineCard({
  name: "Angel of Retribution",
  manaCost: "{6}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike",
});
