import { defineCard } from "../define.js";

export default defineCard({
  name: "Beastmaster Ascension",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "Whenever a creature you control attacks, you may put a quest counter on this enchantment.\n" +
    "As long as this enchantment has seven or more quest counters on it, creatures you control get +5/+5.",
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a quest counter on Beastmaster Ascension?",
        effect: { kind: "add-counter", target: "source", counter: "quest", amount: 1 },
      },
      resolve: null,
      text: "Whenever a creature you control attacks, you may put a quest counter on this enchantment.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control" },
      condition: { kind: "self-counters", counter: "quest", compare: { op: "gte", n: 7 } },
      grantPt: [5, 5],
      text: "As long as this enchantment has seven or more quest counters on it, creatures you control get +5/+5.",
    },
  ],
});
