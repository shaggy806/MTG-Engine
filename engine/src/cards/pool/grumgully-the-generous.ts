import { defineCard } from "../define.js";

// EDHREC rank 4397.
//
// Rulings:
//   [2019-10-04] If a non-Human creature enters the battlefield as a copy of a Human creature, it
//     won't get a +1/+1 counter. Similarly, if a Human enters as a non-Human creature, it will
//     get a +1/+1 counter.
//   [2019-10-04] Any other non-Human creatures that enter the battlefield at the same time as
//     Grumgully won't get a +1/+1 counter.

const TEXT = "Each other non-Human creature you control enters with an additional +1/+1 counter on it.";

export default defineCard({
  name: "Grumgully, the Generous",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 3,
  toughness: 3,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "creature", notSubtypes: ["Human"], controlledBy: "you" },
        counters: { kind: "+1/+1", amount: 1 },
      },
      text: TEXT,
    },
  ],
});
