import { defineCard } from "../define.js";

export default defineCard({
  name: "Hieroglyphic Illumination",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  cycling: { cost: "{U}" },
  text: "Draw two cards.\nCycling {U} ({U}, Discard this card: Draw a card.)",
  effect: { kind: "draw", amount: 2 },
});
