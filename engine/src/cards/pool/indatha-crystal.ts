import { defineCard } from "../define.js";

export default defineCard({
  name: "Indatha Crystal",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  cycling: { cost: "{2}" },
  text: "{T}: Add {W}, {B}, or {G}.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W}, {B}, or {G}.",
    },
  ],
});
