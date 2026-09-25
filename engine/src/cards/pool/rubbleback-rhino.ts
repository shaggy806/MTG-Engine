import { defineCard } from "../define.js";

export default defineCard({
  name: "Rubbleback Rhino",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Rhino"],
  power: 3,
  toughness: 4,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
