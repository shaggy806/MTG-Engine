import { defineCard } from "../define.js";

export default defineCard({
  name: "Coastal Peak",
  colors: [],
  types: ["land"],
  subtypes: ["Island", "Mountain"],
  cycling: { cost: "{2}" },
  text: "({T}: Add {U} or {R}.)\nThis land enters tapped.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {R}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
