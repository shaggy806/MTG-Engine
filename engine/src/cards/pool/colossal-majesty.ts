import { defineCard } from "../define.js";

const UPKEEP =
  "At the beginning of your upkeep, if you control a creature with power 4 or greater, draw a card.";

// An intervening-if (rule 603.4): checked as the upkeep begins and again as
// the trigger resolves.
export default defineCard({
  name: "Colossal Majesty",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: UPKEEP,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: {
        kind: "controls",
        filter: { type: "creature", power: { op: "gte", n: 4 } },
        atLeast: 1,
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: UPKEEP,
    },
  ],
});
