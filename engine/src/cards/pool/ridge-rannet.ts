import { defineCard } from "../define.js";

export default defineCard({
  name: "Ridge Rannet",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 6,
  toughness: 4,
  cycling: { cost: "{2}" },
  text: "Cycling {2} ({2}, Discard this card: Draw a card.)",
});
