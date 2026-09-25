import { defineCard } from "../define.js";

export default defineCard({
  name: "Inkwell Leviathan",
  manaCost: "{7}{U}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Leviathan"],
  power: 7,
  toughness: 11,
  keywords: ["trample", "islandwalk", "shroud"],
  text: "Trample\nIslandwalk (This creature can't be blocked as long as defending player controls an Island.)\nShroud (This creature can't be the target of spells or abilities.)",
});
