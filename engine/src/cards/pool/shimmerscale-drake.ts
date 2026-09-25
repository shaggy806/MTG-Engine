import { defineCard } from "../define.js";

export default defineCard({
  name: "Shimmerscale Drake",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  cycling: { cost: "{2}" },
  text: "Flying\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
