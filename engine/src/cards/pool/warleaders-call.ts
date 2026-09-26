import { defineCard } from "../define.js";

const PING_TEXT = "Whenever a creature you control enters, this enchantment deals 1 damage to each opponent.";

export default defineCard({
  name: "Warleader's Call",
  manaCost: "{1}{R}{W}",
  colors: ["R", "W"],
  types: ["enchantment"],
  text: `Creatures you control get +1/+1.\n${PING_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantPt: [1, 1],
      text: "Creatures you control get +1/+1.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: PING_TEXT,
    },
  ],
});
