import { defineCard } from "../define.js";

export default defineCard({
  name: "Pincher Beetles",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 3,
  toughness: 1,
  keywords: ["shroud"],
  text: "Shroud (This creature can't be the target of spells or abilities.)",
});
