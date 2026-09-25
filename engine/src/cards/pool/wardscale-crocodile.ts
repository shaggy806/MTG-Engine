import { defineCard } from "../define.js";

export default defineCard({
  name: "Wardscale Crocodile",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Crocodile"],
  power: 5,
  toughness: 3,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
