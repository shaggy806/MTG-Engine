import { defineCard } from "../define.js";

export default defineCard({
  name: "Winged Shepherd",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  cycling: { cost: "{W}" },
  text: "Flying, vigilance\nCycling {W} ({W}, Discard this card: Draw a card.)",
});
