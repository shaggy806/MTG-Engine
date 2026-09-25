import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Berserker",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Berserker"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike", "haste"],
  text: "First strike, haste",
});
