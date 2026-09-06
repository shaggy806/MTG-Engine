import { defineCard } from "../define.js";

export default defineCard({
  name: "Raging Goblin",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Berserker"],
  power: 1,
  toughness: 1,
  keywords: ["haste"],
});
