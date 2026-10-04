import { defineCard } from "../define.js";

// EDHREC rank 3840.
//
// Rulings:
//   [2023-09-01] If Tegwyll, Duke of Splendor dies at the same time as one or more other Faeries
//     you control, Tegwyll's ability triggers for each of those other Faeries.

export default defineCard({
  name: "Tegwyll, Duke of Splendor",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Faerie", "Noble"],
  power: 2,
  toughness: 3,
  keywords: ["flying", "deathtouch"],
  text: "Flying, deathtouch\nOther Faeries you control get +1/+1.\nWhenever another Faerie you control dies, you draw a card and you lose 1 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Faerie" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever another Faerie you control dies, you draw a card and you lose 1 life.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Faerie" },
      grantPt: [1, 1],
      text: "Other Faeries you control get +1/+1.",
    },
  ],
});
