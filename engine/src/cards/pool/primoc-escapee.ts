import { defineCard } from "../define.js";

export default defineCard({
  name: "Primoc Escapee",
  manaCost: "{6}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Beast"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  cycling: { cost: "{2}" },
  text: "Flying\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
