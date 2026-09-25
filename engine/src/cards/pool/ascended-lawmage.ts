import { defineCard } from "../define.js";

export default defineCard({
  name: "Ascended Lawmage",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Vedalken", "Wizard"],
  power: 3,
  toughness: 2,
  keywords: ["flying", "hexproof"],
  text: "Flying\nHexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
