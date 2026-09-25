import { defineCard } from "../define.js";

export default defineCard({
  name: "Moaning Wall",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Wall"],
  power: 0,
  toughness: 5,
  keywords: ["defender"],
  cycling: { cost: "{2}" },
  text: "Defender\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
