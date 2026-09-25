import { defineCard } from "../define.js";

export default defineCard({
  name: "Desert of the Fervent",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  cycling: { cost: "{1}{R}" },
  text: "This land enters tapped.\n{T}: Add {R}.\nCycling {1}{R} ({1}{R}, Discard this card: Draw a card.)",
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
