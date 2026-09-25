import { defineCard } from "../define.js";

export default defineCard({
  name: "Wasp Lancer",
  manaCost: "{U/B}{U/B}{U/B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Faerie", "Soldier"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});
