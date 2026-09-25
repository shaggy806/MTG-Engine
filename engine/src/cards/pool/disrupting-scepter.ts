import { defineCard } from "../define.js";

export default defineCard({
  name: "Disrupting Scepter",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{3}, {T}: Target player discards a card. Activate only during your turn.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "{3}, {T}: Target player discards a card. Activate only during your turn.",
      condition: { kind: "your-turn" },
    },
  ],
});
