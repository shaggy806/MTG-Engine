import { defineCard } from "../define.js";

export default defineCard({
  name: "Rampaging Hippo",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hippo"],
  power: 5,
  toughness: 6,
  keywords: ["trample"],
  cycling: { cost: "{2}" },
  text: "Trample\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
