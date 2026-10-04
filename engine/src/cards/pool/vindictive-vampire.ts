import { defineCard } from "../define.js";

// EDHREC rank 4445.
//
// Rulings:
//   [2019-01-25] If your life total is brought to 0 or less at the same time that creatures you
//     control are dealt lethal damage, you lose the game before Vindictive Vampire’s triggered
//     ability goes on the stack.
//   [2019-01-25] If Vindictive Vampire dies at the same time as one or more other creatures you
//     control, Vindictive Vampire’s ability triggers for each of those other creatures.

const TEXT =
  "Whenever another creature you control dies, this creature deals 1 damage to each opponent and you gain 1 life.";

export default defineCard({
  name: "Vindictive Vampire",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
