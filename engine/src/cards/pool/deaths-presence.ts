import { defineCard } from "../define.js";

// EDHREC rank 4893.
//
// Rulings:
//   [2012-10-01] X is the power of that creature as it last existed on the battlefield.
//     (`powerOf: "trigger-object"` reads a dies trigger's creature as it died.)

const TEXT =
  "Whenever a creature you control dies, put X +1/+1 counters on target creature you control, where X is the power of the creature that died.";

export default defineCard({
  name: "Death's Presence",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: { powerOf: "trigger-object" } },
      resolve: null,
      text: TEXT,
    },
  ],
});
