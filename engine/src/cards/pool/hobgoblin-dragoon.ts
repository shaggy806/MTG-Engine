import { defineCard } from "../define.js";

export default defineCard({
  name: "Hobgoblin Dragoon",
  manaCost: "{2}{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Goblin", "Knight"],
  power: 1,
  toughness: 2,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike",
});
