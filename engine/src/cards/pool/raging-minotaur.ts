import { defineCard } from "../define.js";

export default defineCard({
  name: "Raging Minotaur",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Berserker"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste",
});
