import { defineCard } from "../define.js";

export default defineCard({
  name: "Humble Budoka",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 2,
  toughness: 2,
  keywords: ["shroud"],
  text: "Shroud (This creature can't be the target of spells or abilities.)",
});
