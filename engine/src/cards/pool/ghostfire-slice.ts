import { defineCard } from "../define.js";

// EDHREC rank 4598.
//
// Rulings:
//   [2024-06-07] Other cards and abilities can give a card with devoid a color. If that happens,
//     it's just the new color, not that color and colorless.
//   [2024-06-07] Devoid doesn't affect the color identity of the card for the purposes of the
//     Commander variant. For example, while Abstruse Appropriation is colorless because it has
//     devoid, its color identity is still white and black, and it can't be included in a Commander
//     deck where the commander's color identity doesn't include both white and black.
//   [2024-06-07] Devoid works in all zones, not just on the battlefield.
//   [2024-06-07] If a card loses devoid, it will still be colorless. This is because effects that
//     change an object's color (like the one created by devoid) are considered before the object
//     loses devoid.
//   [2024-06-07] A card with devoid is just colorless. It's not colorless and the colors of mana
//     in its mana cost.

export default defineCard({
  name: "Ghostfire Slice",
  manaCost: "{2}{R}",
  colors: [],
  types: ["instant"],
  text: "Devoid (This card has no color.)\nThis spell costs {2} less to cast if an opponent controls a multicolored permanent.\nGhostfire Slice deals 4 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 4, target: 0 },
  // Devoid is the empty `colors` (Kozilek's Unsealing). "An opponent" — one
  // opponent controlling one, which `opponent-controls` counts per player.
  selfCostReduction: {
    condition: { kind: "opponent-controls", filter: { multicolored: true }, atLeast: 1 },
    reduceGeneric: 2,
  },
});
