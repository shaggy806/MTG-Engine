import { defineCard } from "../define.js";

export default defineCard({
  name: "Copper Host Crusher",
  manaCost: "{6}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Bear", "Rhino"],
  power: 8,
  toughness: 8,
  keywords: ["trample", "hexproof"],
  text: "Trample\nHexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
