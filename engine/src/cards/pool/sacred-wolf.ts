import { defineCard } from "../define.js";

export default defineCard({
  name: "Sacred Wolf",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 3,
  toughness: 1,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
