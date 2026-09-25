import { defineCard } from "../define.js";

export default defineCard({
  name: "Desert of the Glorified",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  cycling: { cost: "{1}{B}" },
  text: "This land enters tapped.\n{T}: Add {B}.\nCycling {1}{B} ({1}{B}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
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
