import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your upkeep, put two descent counters on this enchantment. Then each player creates X Treasure tokens and this enchantment deals X damage to each player, where X is the number of descent counters on this enchantment.";

// X is counted after the two new counters go on — and, if it has left the
// battlefield by then, as it last existed there.
const X = { countersOn: "source", counter: "descent" } as const;

export default defineCard({
  name: "Descent into Avernus",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "descent", amount: 2 },
          { kind: "create-token", token: "Treasure Token", count: X, who: "each-player" },
          { kind: "damage", amount: X, who: "each-player" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
