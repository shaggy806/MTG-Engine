import { defineCard } from "../define.js";

// EDHREC rank 5274.

export default defineCard({
  name: "Fervent Charge",
  manaCost: "{1}{R}{W}{B}",
  colors: ["W", "B", "R"],
  types: ["enchantment"],
  text: "Whenever a creature you control attacks, it gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "modify-pt", target: "trigger-object", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever a creature you control attacks, it gets +2/+2 until end of turn.",
    },
  ],
});
