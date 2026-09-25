import { defineCard } from "../define.js";

export default defineCard({
  name: "Hullcarver",
  manaCost: "{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Assassin"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch",
});
