import { defineCard } from "../define.js";

export default defineCard({
  name: "Hearthfire Hobgoblin",
  manaCost: "{R/W}{R/W}{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Goblin", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["double-strike"],
  text: "Double strike",
});
