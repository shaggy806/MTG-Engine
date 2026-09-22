import { defineCard } from "../define.js";

// Top-commanders rank 280. The opponent is a target, chosen as each draw
// trigger goes on the stack.
export default defineCard({
  name: "Queza, Augur of Agonies",
  manaCost: "{1}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Octopus", "Advisor"],
  power: 3,
  toughness: 4,
  text: "Whenever you draw a card, target opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, target: 0 },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever you draw a card, target opponent loses 1 life and you gain 1 life.",
    },
  ],
});
