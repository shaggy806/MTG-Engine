import { defineCard } from "../define.js";

export default defineCard({
  name: "Sandbar Serpent",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 3,
  toughness: 4,
  cycling: { cost: "{2}" },
  text: "Cycling {2} ({2}, Discard this card: Draw a card.)",
});
