import { defineCard } from "../define.js";

export default defineCard({
  name: "Taoist Hermit",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Mystic"],
  power: 2,
  toughness: 2,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
