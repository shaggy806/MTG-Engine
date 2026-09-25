import { defineCard } from "../define.js";

export default defineCard({
  name: "Conifer Strider",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 1,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
