import { defineCard } from "../define.js";

export default defineCard({
  name: "Pendrell Drake",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  cycling: { cost: "{2}" },
  text: "Flying\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
