import { defineCard } from "../define.js";

export default defineCard({
  name: "Vizkopa Vampire",
  manaCost: "{2}{W/B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 3,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink",
});
