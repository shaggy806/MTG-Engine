import { defineCard } from "../define.js";

export default defineCard({
  name: "Rakdos Ragemutt",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 3,
  toughness: 3,
  keywords: ["lifelink", "haste"],
  text: "Lifelink, haste",
});
