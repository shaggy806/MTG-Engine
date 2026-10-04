import { defineCard } from "../define.js";

// EDHREC rank 2900.
//
// Rulings:
//   [2021-07-23] Flumph's ability will trigger even if it is dealt lethal damage.
//   [2021-07-23] If the opponent is somehow an illegal target for Flumph's ability when it tries
//     to resolve, neither player will draw a card.
//   [2021-07-23] Flumph's triggered ability is not optional. You must target an opponent if able.
//   [2021-07-23] Flumph's ability only triggers once each time it is dealt damage, even if
//     multiple sources are dealing damage to it at once.

export default defineCard({
  name: "Flumph",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Jellyfish"],
  power: 0,
  toughness: 4,
  keywords: ["defender", "flying"],
  text: "Defender, flying\nWhenever this creature is dealt damage, you and target opponent each draw a card.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "draw", amount: 1, target: 0 },
        ],
      },
      resolve: null,
      text: "Whenever this creature is dealt damage, you and target opponent each draw a card.",
    },
  ],
});
