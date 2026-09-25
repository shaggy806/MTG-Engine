import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Striker",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Berserker"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike", "haste"],
  text: "First strike, haste",
});
