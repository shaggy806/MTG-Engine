import { defineCard } from "../define.js";

// EDHREC rank 2485.
//
// Rulings:
//   [2024-07-26] The value of X is determined as Valley Rotcaller’s triggered ability resolves.

const ATTACK_TEXT =
  "Whenever this creature attacks, each opponent loses X life and you gain X life, where X is the number of other Squirrels, Bats, Lizards, and Rats you control.";
const OTHERS = {
  countOf: { subtypes: ["Squirrel", "Bat", "Lizard", "Rat"], controlledBy: "you" },
  excludeSelf: true,
} as const;

export default defineCard({
  name: "Valley Rotcaller",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Squirrel", "Warlock"],
  power: 1,
  toughness: 3,
  keywords: ["menace"],
  text: `Menace\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: OTHERS, who: "each-opponent" },
          { kind: "gain-life", amount: OTHERS },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
