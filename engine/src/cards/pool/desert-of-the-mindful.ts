import { defineCard } from "../define.js";

export default defineCard({
  name: "Desert of the Mindful",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  cycling: { cost: "{1}{U}" },
  text: "This land enters tapped.\n{T}: Add {U}.\nCycling {1}{U} ({1}{U}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
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
