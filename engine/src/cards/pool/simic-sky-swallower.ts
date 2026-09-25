import { defineCard } from "../define.js";

export default defineCard({
  name: "Simic Sky Swallower",
  manaCost: "{5}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Leviathan"],
  power: 6,
  toughness: 6,
  keywords: ["flying", "trample", "shroud"],
  text: "Flying, trample\nShroud (This creature can't be the target of spells or abilities.)",
});
