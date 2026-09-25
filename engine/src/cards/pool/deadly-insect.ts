import { defineCard } from "../define.js";

export default defineCard({
  name: "Deadly Insect",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 6,
  toughness: 1,
  keywords: ["shroud"],
  text: "Shroud (This creature can't be the target of spells or abilities.)",
});
