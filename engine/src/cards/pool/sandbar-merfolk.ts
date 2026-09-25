import { defineCard } from "../define.js";

export default defineCard({
  name: "Sandbar Merfolk",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 1,
  toughness: 1,
  cycling: { cost: "{2}" },
  text: "Cycling {2} ({2}, Discard this card: Draw a card.)",
});
