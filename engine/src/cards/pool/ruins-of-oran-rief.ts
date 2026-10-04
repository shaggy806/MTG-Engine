import { defineCard } from "../define.js";

// EDHREC rank 6367.
//
// Rulings:
//   [2016-01-22] The target of the last ability didn’t necessarily have to be a colorless creature
//     as it entered the battlefield, provided it entered the battlefield during that turn.
//     However, it does have to be a colorless creature to be a legal target of the ability.

export default defineCard({
  name: "Ruins of Oran-Rief",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {C}. ({C} represents colorless mana.)\n{T}: Put a +1/+1 counter on target colorless creature that entered this turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", colorless: true, enteredThisTurn: true } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{T}: Put a +1/+1 counter on target colorless creature that entered this turn.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
