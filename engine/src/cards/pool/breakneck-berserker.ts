import { defineCard } from "../define.js";

export default defineCard({
  name: "Breakneck Berserker",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dwarf", "Berserker"],
  power: 3,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste",
});
