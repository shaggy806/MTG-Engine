import { defineCard } from "../define.js";

export default defineCard({
  name: "Scaled Behemoth",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Crocodile"],
  power: 6,
  toughness: 7,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
