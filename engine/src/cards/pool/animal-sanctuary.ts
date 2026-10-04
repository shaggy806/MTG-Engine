import { defineCard } from "../define.js";

// EDHREC rank 3796.

const PUMP = "{2}, {T}: Put a +1/+1 counter on target Bird, Cat, Dog, Goat, Ox, or Snake.";

export default defineCard({
  name: "Animal Sanctuary",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${PUMP}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [{ kind: "permanent", filter: { subtypes: ["Bird", "Cat", "Dog", "Goat", "Ox", "Snake"] } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: PUMP,
    },
  ],
});
