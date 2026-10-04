import { defineCard } from "../define.js";

// EDHREC rank 4674.
//
// Rulings:
//   [2024-06-07] Other cards and abilities can give a card with devoid a color. If that happens,
//     it's just the new color, not that color and colorless.
//   [2024-06-07] If a card loses devoid, it will still be colorless. This is because effects that
//     change an object's color (like the one created by devoid) are considered before the object
//     loses devoid.
//   [2024-06-07] Devoid works in all zones, not just on the battlefield.
//   [2024-06-07] Devoid doesn't affect the color identity of the card for the purposes of the
//     Commander variant. For example, while Abstruse Appropriation is colorless because it has
//     devoid, its color identity is still white and black, and it can't be included in a Commander
//     deck where the commander's color identity doesn't include both white and black.
//   [2024-06-07] A card with devoid is just colorless. It's not colorless and the colors of mana
//     in its mana cost.

export default defineCard({
  name: "Snapping Voidcraw",
  manaCost: "{1}{G}{U}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi", "Turtle"],
  power: 1,
  toughness: 3,
  text: "Devoid (This card has no color.)\n{T}: Add {C}{C}.\n{3}{C}, {T}: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "{T}: Add {C}{C}.",
    },
    {
      cost: { mana: "{3}{C}", tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}{C}, {T}: Draw a card.",
    },
  ],
  // Devoid: printed colourless (`colors: []`), as Eldrazi Displacer.
});
