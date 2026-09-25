import { defineCard } from "../define.js";

export default defineCard({
  name: "Zephid",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Illusion"],
  power: 3,
  toughness: 4,
  keywords: ["flying", "shroud"],
  text: "Flying\nShroud (This creature can't be the target of spells or abilities.)",
});
