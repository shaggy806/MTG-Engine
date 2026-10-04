import { defineCard } from "../define.js";

// EDHREC rank 5373.
//
// Rulings:
//   [2022-02-18] The word “otherwise” in Gravelighter's triggered ability refers to whether or not
//     a creature died this turn, not whether or not a card was drawn.

export default defineCard({
  name: "Gravelighter",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, draw a card if a creature died this turn. Otherwise, each player sacrifices a creature of their choice.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Checked as it resolves. "Otherwise" is about whether a creature died
      // this turn, not whether a card was drawn (the ruling).
      effect: {
        kind: "conditional",
        condition: { kind: "creature-died-this-turn" },
        then: { kind: "draw", amount: 1 },
        else: { kind: "sacrifice", who: "each-player", filter: { type: "creature" }, count: 1 },
      },
      resolve: null,
      text: "When this creature enters, draw a card if a creature died this turn. Otherwise, each player sacrifices a creature of their choice.",
    },
  ],
});
