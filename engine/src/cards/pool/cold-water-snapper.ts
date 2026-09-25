import { defineCard } from "../define.js";

export default defineCard({
  name: "Cold-Water Snapper",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Turtle"],
  power: 4,
  toughness: 5,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
