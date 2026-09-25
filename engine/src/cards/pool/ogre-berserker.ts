import { defineCard } from "../define.js";

export default defineCard({
  name: "Ogre Berserker",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre", "Berserker"],
  power: 4,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste",
});
