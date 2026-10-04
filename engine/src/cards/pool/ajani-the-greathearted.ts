import { defineCard } from "../define.js";

// EDHREC rank 4110.
//
// Rulings:
//   [2019-05-03] If Ajani is somehow a creature as his last ability resolves, he'll get a +1/+1
//     counter.
//   [2019-05-03] If a planeswalker you control is also a creature (most likely because it's
//     Gideon), that planeswalker receives both a +1/+1 counter and a loyalty counter as Ajani's
//     last ability resolves.

const MINUS_TEXT =
  "−2: Put a +1/+1 counter on each creature you control and a loyalty counter on each other planeswalker you control.";

export default defineCard({
  name: "Ajani, the Greathearted",
  manaCost: "{2}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Ajani"],
  loyalty: 5,
  text: `Creatures you control have vigilance.\n+1: You gain 3 life.\n${MINUS_TEXT}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "+1: You gain 3 life.",
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          // No `exceptSource`: Ajani gets a +1/+1 counter if he's a creature (the ruling).
          { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
          {
            kind: "add-counter-all",
            filter: { type: "planeswalker", controlledBy: "you" },
            counter: "loyalty",
            amount: 1,
            exceptSource: true,
          },
        ],
        // One instruction: every counter goes on at once (Broker's Ascendancy's shape).
        simultaneous: true,
      },
      resolve: null,
      text: MINUS_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["vigilance"],
      text: "Creatures you control have vigilance.",
    },
  ],
});
