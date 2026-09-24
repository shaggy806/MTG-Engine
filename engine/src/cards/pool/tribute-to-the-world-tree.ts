import { defineCard } from "../define.js";

// "Its power" is read as the trigger resolves, off the creature that entered.
export default defineCard({
  name: "Tribute to the World Tree",
  manaCost: "{G}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "Whenever a creature you control enters, draw a card if its power is 3 or greater. Otherwise, put two +1/+1 counters on it.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: { power: { op: "gte", n: 3 } } },
        then: { kind: "draw", amount: 1 },
        else: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 2 },
      },
      resolve: null,
      text:
        "Whenever a creature you control enters, draw a card if its power is 3 or greater. Otherwise, put two +1/+1 counters on it.",
    },
  ],
});
