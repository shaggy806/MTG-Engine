import { defineCard } from "../define.js";

export default defineCard({
  name: "Striped Riverwinder",
  manaCost: "{6}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 5,
  toughness: 5,
  keywords: ["hexproof"],
  cycling: { cost: "{U}" },
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)\nCycling {U} ({U}, Discard this card: Draw a card.)",
});
