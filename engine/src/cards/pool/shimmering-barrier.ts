import { defineCard } from "../define.js";

export default defineCard({
  name: "Shimmering Barrier",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 1,
  toughness: 3,
  keywords: ["defender", "first-strike"],
  cycling: { cost: "{2}" },
  text: "Defender (This creature can't attack.)\nFirst strike\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
