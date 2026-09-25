import { defineCard } from "../define.js";

export default defineCard({
  name: "Barkhide Mauler",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 4,
  cycling: { cost: "{2}" },
  text: "Cycling {2} ({2}, Discard this card: Draw a card.)",
});
