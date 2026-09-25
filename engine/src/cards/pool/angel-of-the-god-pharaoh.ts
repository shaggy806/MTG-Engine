import { defineCard } from "../define.js";

export default defineCard({
  name: "Angel of the God-Pharaoh",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  cycling: { cost: "{2}" },
  text: "Flying\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
