import { defineCard } from "../define.js";

export default defineCard({
  name: "Slippery Karst",
  colors: [],
  types: ["land"],
  cycling: { cost: "{2}" },
  text: "This land enters tapped.\n{T}: Add {G}.\nCycling {2} ({2}, Discard this card: Draw a card.)",
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
