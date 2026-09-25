import { defineCard } from "../define.js";

export default defineCard({
  name: "Lava Serpent",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Serpent"],
  power: 5,
  toughness: 5,
  keywords: ["haste"],
  cycling: { cost: "{2}" },
  text: "Haste\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
