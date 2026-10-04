import { defineCard } from "../define.js";

// EDHREC rank 2566.
//
// Rulings:
//   [2016-04-08] You can sacrifice Indulgent Aristocrat to pay the cost of its own activated
//     ability.

const TEXT = "{2}, Sacrifice a creature: Put a +1/+1 counter on each Vampire you control.";

export default defineCard({
  name: "Indulgent Aristocrat",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Noble"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: `Lifelink\n${TEXT}`,
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { subtype: "Vampire", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
