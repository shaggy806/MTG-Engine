import { defineCard } from "../define.js";

export default defineCard({
  name: "Plated Crusher",
  manaCost: "{4}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 7,
  toughness: 6,
  keywords: ["trample", "hexproof"],
  text: "Trample\nHexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
