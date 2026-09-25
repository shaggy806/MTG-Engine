import { defineCard } from "../define.js";

export default defineCard({
  name: "Courier Hawk",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 2,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
