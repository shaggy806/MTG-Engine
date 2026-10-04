import { defineCard } from "../define.js";

// EDHREC rank 2938.
//
// Rulings:
//   [2022-04-29] A permanent that is somehow both a creature and a planeswalker as Brokers
//     Ascendancy's ability resolves will get both a +1/+1 counter and a loyalty counter.

export default defineCard({
  name: "Brokers Ascendancy",
  manaCost: "{G}{W}{U}",
  colors: ["W", "U", "G"],
  types: ["enchantment"],
  text: "At the beginning of your end step, put a +1/+1 counter on each creature you control and a loyalty counter on each planeswalker you control.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
          { kind: "add-counter-all", filter: { type: "planeswalker", controlledBy: "you" }, counter: "loyalty", amount: 1 },
        ],
        // One instruction: every counter goes on at once.
        simultaneous: true,
      },
      resolve: null,
      text: "At the beginning of your end step, put a +1/+1 counter on each creature you control and a loyalty counter on each planeswalker you control.",
    },
  ],
});
