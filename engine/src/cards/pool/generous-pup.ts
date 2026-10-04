import { defineCard } from "../define.js";

// EDHREC rank 5474.
//
// Rulings:
//   [2024-11-08] Generous Pup's last ability puts only one +1/+1 counter on each other creature
//     you control, no matter how many +1/+1 counters were put on Generous Pup.

const TEXT =
  "Whenever one or more +1/+1 counters are put on this creature, put a +1/+1 counter on each other creature you control. This ability triggers only once each turn.";

export default defineCard({
  name: "Generous Pup",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: `Vigilance\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "counters-put", who: "self", counter: "+1/+1" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      oncePerTurn: true,
      text: TEXT,
    },
  ],
});
