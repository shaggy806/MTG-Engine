import { defineCard } from "../define.js";

export default defineCard({
  name: "Insatiable Harpy",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Harpy"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "lifelink"],
  text: "Flying, lifelink",
});
