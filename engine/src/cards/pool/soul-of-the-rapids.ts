import { defineCard } from "../define.js";

export default defineCard({
  name: "Soul of the Rapids",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 2,
  keywords: ["flying", "hexproof"],
  text: "Flying\nHexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
