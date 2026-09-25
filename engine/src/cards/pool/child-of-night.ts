import { defineCard } from "../define.js";

export default defineCard({
  name: "Child of Night",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink",
});
