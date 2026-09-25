import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyshroud Falcon",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
