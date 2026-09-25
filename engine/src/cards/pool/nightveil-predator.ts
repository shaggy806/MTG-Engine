import { defineCard } from "../define.js";

export default defineCard({
  name: "Nightveil Predator",
  manaCost: "{U}{U}{B}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "deathtouch", "hexproof"],
  text: "Flying, deathtouch\nHexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
