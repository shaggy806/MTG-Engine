import { defineCard } from "../define.js";

export default defineCard({
  name: "Macetail Hystrodon",
  manaCost: "{6}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 4,
  keywords: ["first-strike", "haste"],
  cycling: { cost: "{3}" },
  text: "First strike, haste\nCycling {3} ({3}, Discard this card: Draw a card.)",
});
