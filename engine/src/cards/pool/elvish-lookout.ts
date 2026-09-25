import { defineCard } from "../define.js";

export default defineCard({
  name: "Elvish Lookout",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
  keywords: ["shroud"],
  text: "Shroud (This creature can't be the target of spells or abilities.)",
});
