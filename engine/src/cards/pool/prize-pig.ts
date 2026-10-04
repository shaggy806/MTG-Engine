import { defineCard } from "../define.js";

// EDHREC rank 5348.
//
// Rulings:
//   [2023-06-16] If there are three or more ribbon counters on Prize Pig after you put ribbon
//     counters on it, all of the counters will be removed. It does not matter whether or not Prize
//     Pig is already untapped.

export default defineCard({
  name: "Prize Pig",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Boar"],
  power: 0,
  toughness: 3,
  text: "Whenever you gain life, put that many ribbon counters on this creature. Then if there are three or more ribbon counters on this creature, remove those counters and untap it.\n{T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "ribbon", amount: { triggerValue: true } },
          {
            kind: "conditional",
            condition: { kind: "self-counters", counter: "ribbon", compare: { op: "gte", n: 3 } },
            then: {
              kind: "sequence",
              effects: [
                {
                  kind: "remove-counter",
                  target: "source",
                  counter: "ribbon",
                  amount: { countersOn: "source", counter: "ribbon" },
                },
                { kind: "untap", target: "source" },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: "Whenever you gain life, put that many ribbon counters on this creature. Then if there are three or more ribbon counters on this creature, remove those counters and untap it.",
    },
  ],
});
