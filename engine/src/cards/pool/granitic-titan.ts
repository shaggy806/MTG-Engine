import { defineCard } from "../define.js";

export default defineCard({
  name: "Granitic Titan",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 4,
  keywords: ["menace"],
  cycling: { cost: "{2}" },
  text: "Menace\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
