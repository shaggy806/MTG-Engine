import { defineCard } from "../define.js";

export default defineCard({
  name: "Forgotten Cave",
  colors: [],
  types: ["land"],
  cycling: { cost: "{R}" },
  text: "This land enters tapped.\n{T}: Add {R}.\nCycling {R} ({R}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
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
