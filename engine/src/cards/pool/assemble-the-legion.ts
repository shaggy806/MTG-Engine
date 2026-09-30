import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your upkeep, put a muster counter on this enchantment. Then create a 1/1 red and white Soldier creature token with haste for each muster counter on this enchantment.";

export default defineCard({
  name: "Assemble the Legion",
  manaCost: "{3}{R}{W}",
  colors: ["R", "W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "muster", amount: 1 },
          { kind: "create-token", token: "Red-White Soldier Token", count: { countersOn: "source", counter: "muster" } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
