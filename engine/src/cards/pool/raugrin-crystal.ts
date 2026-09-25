import { defineCard } from "../define.js";

export default defineCard({
  name: "Raugrin Crystal",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  cycling: { cost: "{2}" },
  text: "{T}: Add {U}, {R}, or {W}.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "R", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U}, {R}, or {W}.",
    },
  ],
});
