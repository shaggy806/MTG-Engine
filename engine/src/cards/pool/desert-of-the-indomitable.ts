import { defineCard } from "../define.js";

export default defineCard({
  name: "Desert of the Indomitable",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  cycling: { cost: "{1}{G}" },
  text: "This land enters tapped.\n{T}: Add {G}.\nCycling {1}{G} ({1}{G}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
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
