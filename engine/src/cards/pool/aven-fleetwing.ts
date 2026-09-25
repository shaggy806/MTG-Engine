import { defineCard } from "../define.js";

export default defineCard({
  name: "Aven Fleetwing",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "hexproof"],
  text: "Flying\nHexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
