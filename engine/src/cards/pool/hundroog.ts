import { defineCard } from "../define.js";

export default defineCard({
  name: "Hundroog",
  manaCost: "{6}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 7,
  cycling: { cost: "{3}" },
  text: "Cycling {3} ({3}, Discard this card: Draw a card.)",
});
