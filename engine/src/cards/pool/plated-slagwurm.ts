import { defineCard } from "../define.js";

export default defineCard({
  name: "Plated Slagwurm",
  manaCost: "{4}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 8,
  toughness: 8,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
