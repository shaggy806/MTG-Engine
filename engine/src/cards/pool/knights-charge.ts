import { defineCard } from "../define.js";

// EDHREC rank 6415.
//
// Rulings:
//   [2019-10-04] In a Two-Headed Giant game, Knights' Charge's first ability causes the opposing
//     team to lose 1 life twice, and you gain 1 life once.

const ATTACK_TEXT = "Whenever a Knight you control attacks, each opponent loses 1 life and you gain 1 life.";
const RETURN_TEXT =
  "{6}{W}{B}, Sacrifice this enchantment: Return all Knight creature cards from your graveyard to the battlefield.";

export default defineCard({
  name: "Knights' Charge",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  types: ["enchantment"],
  text: `${ATTACK_TEXT}\n${RETURN_TEXT}`,
  activated: [
    {
      cost: { mana: "{6}{W}{B}", tap: false, sacrifice: "self" },
      targets: [],
      // Brilliant Restoration's shape.
      effect: {
        kind: "return-from-graveyard",
        filter: { type: "creature", subtype: "Knight" },
        destination: "battlefield",
        count: "all",
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { subtype: "Knight" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
