import { defineCard } from "../define.js";

// EDHREC rank 4708.
// Makes Inkling → "Inkling Token".
//
// Rulings:
//   [2021-04-16] If the creature with mentor leaves the battlefield with mentor on the stack, use
//     its power as that creature last existed on the battlefield to determine whether the target
//     creature has less power.
//   [2021-04-16] Mentor compares the power of the creature with mentor with that of the target
//     creature at two different times: once as the triggered ability is put onto the stack, and
//     once as the triggered ability resolves.
//   [2021-04-16] The last ability counts the number of all kinds of counters, not just +1/+1
//     counters.
// Mentor is Legion Warboss's shape. The dies trigger's "if it had counters on
// it" is its filter, read off the creature as it last existed (counters of any
// kind), and X reads the same last-known counters.

const MENTOR_TEXT =
  "Mentor (Whenever this creature attacks, put a +1/+1 counter on target attacking creature with lesser power.)";
const INKLING_TEXT =
  "Whenever a nontoken creature you control dies, if it had counters on it, create X tapped 2/1 white and black Inkling creature tokens with flying, where X is the number of counters it had on it.";

export default defineCard({
  name: "Felisa, Fang of Silverquill",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Wizard"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${MENTOR_TEXT}\n${INKLING_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [
        {
          kind: "permanent",
          filter: { type: "creature", attacking: true, power: { op: "lt", n: { amount: { powerOf: "source" } } } },
        },
      ],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: MENTOR_TEXT,
    },
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { token: false, type: "creature", counters: { compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Inkling Token",
        count: { countersOn: "trigger-object" },
        tapped: true,
      },
      resolve: null,
      text: INKLING_TEXT,
    },
  ],
});
