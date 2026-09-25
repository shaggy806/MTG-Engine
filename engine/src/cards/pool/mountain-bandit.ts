import { defineCard } from "../define.js";

export default defineCard({
  name: "Mountain Bandit",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Rogue"],
  power: 1,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste",
});
