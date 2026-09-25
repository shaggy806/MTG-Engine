import { defineCard } from "../define.js";

export default defineCard({
  name: "Blasted Landscape",
  colors: [],
  types: ["land"],
  cycling: { cost: "{2}" },
  text: "{T}: Add {C}.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
  ],
});
