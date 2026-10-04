import { defineCard } from "../define.js";

// EDHREC rank 5128.
//
// Rulings:
//   [2014-09-20] A monocolored creature is exactly one color. Colorless creatures aren't
//     monocolored.

// "Monocolored" is exactly one colour (Vanishing Verse's filter): not
// multicoloured, and at least one colour, so a colourless creature isn't a
// legal target.
export default defineCard({
  name: "Sultai Charm",
  manaCost: "{B}{G}{U}",
  colors: ["U", "B", "G"],
  types: ["instant"],
  text: "Choose one —\n• Destroy target monocolored creature.\n• Destroy target artifact or enchantment.\n• Draw two cards, then discard a card.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target monocolored creature.",
        targets: [
          {
            kind: "permanent",
            filter: {
              type: "creature",
              multicolored: false,
              anyOf: [{ colors: ["W"] }, { colors: ["U"] }, { colors: ["B"] }, { colors: ["R"] }, { colors: ["G"] }],
            },
          },
        ],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target artifact or enchantment.",
        targets: ["artifact-or-enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Draw two cards, then discard a card.",
        targets: [],
        effect: {
          kind: "sequence",
          effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 1 }],
        },
      },
    ],
  },
});
