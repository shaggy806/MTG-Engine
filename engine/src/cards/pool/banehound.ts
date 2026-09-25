import { defineCard } from "../define.js";

export default defineCard({
  name: "Banehound",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Nightmare", "Dog"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink", "haste"],
  text: "Lifelink, haste",
});
