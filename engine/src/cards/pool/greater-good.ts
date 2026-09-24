import { defineCard } from "../define.js";

// The sacrificed creature's power is read as it last existed on the
// battlefield (rule 608.2h).
export default defineCard({
  name: "Greater Good",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Sacrifice a creature: Draw cards equal to the sacrificed creature's power, then discard three cards.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: { powerOf: "sacrificed" } },
          { kind: "discard", target: "you", amount: 3 },
        ],
      },
      resolve: null,
      text: "Sacrifice a creature: Draw cards equal to the sacrificed creature's power, then discard three cards.",
    },
  ],
});
