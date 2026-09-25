import { defineCard } from "../define.js";

export default defineCard({
  name: "Scepter of Fugue",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["artifact"],
  text: "{1}{B}, {T}: Target player discards a card. Activate only during your turn.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: true },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "{1}{B}, {T}: Target player discards a card. Activate only during your turn.",
      condition: { kind: "your-turn" },
    },
  ],
});
