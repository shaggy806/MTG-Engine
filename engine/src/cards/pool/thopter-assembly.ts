import { defineCard } from "../define.js";

// EDHREC rank 5429.
// Makes Thopter → use "Thopter Token".
//
// Rulings:
//   [2011-06-01] The triggered ability looks for any permanent you control with the creature type
//     Thopter, not just the Thopter tokens previously created by a Thopter Assembly.

export default defineCard({
  name: "Thopter Assembly",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Thopter"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nAt the beginning of your upkeep, if you control no Thopters other than this creature, return this creature to its owner's hand and create five 1/1 colorless Thopter artifact creature tokens with flying.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: {
        kind: "not",
        of: { kind: "controls", filter: { subtype: "Thopter" }, atLeast: 1, excludeSelf: true },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "return-to-hand", target: "source" },
          { kind: "create-token", token: "Thopter Token", count: 5 },
        ],
      },
      resolve: null,
      text: "At the beginning of your upkeep, if you control no Thopters other than this creature, return this creature to its owner's hand and create five 1/1 colorless Thopter artifact creature tokens with flying.",
    },
  ],
});
