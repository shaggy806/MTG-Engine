import { defineCard } from "../define.js";

export default defineCard({
  name: "Desert of the True",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  cycling: { cost: "{1}{W}" },
  text: "This land enters tapped.\n{T}: Add {W}.\nCycling {1}{W} ({1}{W}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
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
