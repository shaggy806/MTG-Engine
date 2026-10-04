import { defineCard } from "../define.js";

// EDHREC rank 5627.

export default defineCard({
  name: "Coretapper",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 1,
  toughness: 1,
  text: "{T}: Put a charge counter on target artifact.\nSacrifice this creature: Put two charge counters on target artifact.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["artifact"],
      effect: { kind: "add-counter", target: 0, counter: "charge", amount: 1 },
      resolve: null,
      text: "{T}: Put a charge counter on target artifact.",
    },
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["artifact"],
      effect: { kind: "add-counter", target: 0, counter: "charge", amount: 2 },
      resolve: null,
      text: "Sacrifice this creature: Put two charge counters on target artifact.",
    },
  ],
});
