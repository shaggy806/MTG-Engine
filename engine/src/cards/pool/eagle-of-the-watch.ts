import { defineCard } from "../define.js";

export default defineCard({
  name: "Eagle of the Watch",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 1,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
