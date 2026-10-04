import { defineCard } from "../define.js";

// EDHREC rank 2831.
// Makes Eldrazi Spawn → use "Eldrazi Spawn Token".
//
// Rulings:
//   [2024-06-07] Devoid works in all zones, not just on the battlefield.
//   [2024-06-07] Other cards and abilities can give a card with devoid a color. If that happens,
//     it's just the new color, not that color and colorless.
//   [2024-06-07] If a card loses devoid, it will still be colorless. This is because effects that
//     change an object's color (like the one created by devoid) are considered before the object
//     loses devoid.
//   [2024-06-07] Kozilek's Unsealing's triggered abilities trigger before the spell that causes it
//     to trigger. The ability will resolve even if that spell is countered or otherwise leaves the
//     stack.
//   [2024-06-07] A card with devoid is just colorless. It's not colorless and the colors of mana
//     in its mana cost.
//   [2024-06-07] Devoid doesn't affect the color identity of the card for the purposes of the
//     Commander variant. For example, while Abstruse Appropriation is colorless because it has
//     devoid, its color identity is still white and black, and it can't be included in a Commander
//     deck where the commander's color identity doesn't include both white and black.
//   [2024-06-07] If you cast a creature spell with {X} in its mana cost, use the value of X that
//     was chosen when it was cast to determine its mana value.

const SPAWN_TEXT =
  'Whenever you cast a creature spell with mana value 4, 5, or 6, create two 0/1 colorless Eldrazi Spawn creature tokens with "Sacrifice this token: Add {C}."';
const DRAW_TEXT = "Whenever you cast a creature spell with mana value 7 or greater, draw three cards.";

// Devoid (rule 702.114): no colours, whatever its mana cost says.
export default defineCard({
  name: "Kozilek's Unsealing",
  manaCost: "{2}{U}",
  colors: [],
  types: ["enchantment"],
  text: `Devoid (This card has no color.)\n${SPAWN_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: {
          type: "creature",
          anyOf: [
            { manaValue: { op: "eq", n: 4 } },
            { manaValue: { op: "eq", n: 5 } },
            { manaValue: { op: "eq", n: 6 } },
          ],
        },
      },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Spawn Token", count: 2 },
      resolve: null,
      text: SPAWN_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature", manaValue: { op: "gte", n: 7 } } },
      targets: [],
      effect: { kind: "draw", amount: 3 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
