import { defineCard } from "../define.js";

export default defineCard({
  name: "Kalonian Behemoth",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 9,
  toughness: 9,
  keywords: ["shroud"],
  text: "Shroud (This creature can't be the target of spells or abilities.)",
});
