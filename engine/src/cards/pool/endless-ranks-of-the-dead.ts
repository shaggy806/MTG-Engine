import { defineCard } from "../define.js";

// EDHREC rank 2457.
// Makes Zombie → use "Zombie Token".
//
// Rulings:
//   [2011-09-22] If you control fewer than two Zombies, you won't get any tokens.
//   [2011-09-22] The number of Zombies you control is counted when the ability resolves. If you
//     control multiple Endless Ranks of the Dead, the tokens you get when the first ability
//     resolves will count for the subsequent abilities (if the tokens are still under your control
//     at that time).
const TEXT =
  "At the beginning of your upkeep, create X 2/2 black Zombie creature tokens, where X is half the number of Zombies you control, rounded down.";

export default defineCard({
  name: "Endless Ranks of the Dead",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Zombie Token",
        count: { half: { countOf: { subtype: "Zombie", controlledBy: "you" } }, round: "down" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
