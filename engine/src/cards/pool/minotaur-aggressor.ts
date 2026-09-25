import { defineCard } from "../define.js";

export default defineCard({
  name: "Minotaur Aggressor",
  manaCost: "{6}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Berserker"],
  power: 6,
  toughness: 2,
  keywords: ["first-strike", "haste"],
  text: "First strike, haste",
});
