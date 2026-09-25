import { defineCard } from "../define.js";

export default defineCard({
  name: "Healer's Flock",
  manaCost: "{W}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "lifelink"],
  text: "Flying, lifelink",
});
